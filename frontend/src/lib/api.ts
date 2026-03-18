/**
 * api.ts — Instancia Axios centralizada para comunicacao com o backend.
 *
 * Funcionalidades:
 * - Configuracao base (URL, timeout, credenciais)
 * - Interceptor de request: auto-detecta FormData para upload de arquivos
 * - Interceptor de response: unwrap automatico da resposta, refresh transparente de token JWT
 * - Fila de requisicoes durante refresh para evitar multiplos refreshes simultaneos
 * - Gerenciamento do access token (localStorage + header Authorization)
 */

import axios from 'axios';
import { API_URL } from './constants';

// Instancia Axios configurada para o backend CraftCard.
// withCredentials: true envia cookies httpOnly (refresh token) automaticamente.
// timeout de 20s para cobrir cold starts do Render (free tier demora ~2-3 min).
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000, // 20s — previne travamento em cold starts do Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Controle de refresh token: evita multiplos refreshes simultaneos.
// Quando isRefreshing=true, novas requisicoes 401 sao enfileiradas
// e retomadas apos o refresh completar.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/** Resolve ou rejeita todas as requisicoes enfileiradas durante o refresh */
function processQueue(error: unknown | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

// Interceptor de request: quando o body e FormData (upload de imagem/arquivo),
// remove o Content-Type para que o Axios defina automaticamente o boundary do multipart.
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Interceptor de response:
// 1. Sucesso: faz unwrap automatico (response.data.data ?? response.data) para que
//    os hooks recebam os dados diretamente, sem acessar .data manualmente
// 2. Erro 401: tenta refresh transparente do token JWT via cookie httpOnly
// 3. Outros erros: normaliza em um Error com code e details para consumo uniforme
api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error) => {
    const originalRequest = error.config;

    // Fluxo de refresh: se recebeu 401 e ainda nao tentou refresh nesta requisicao
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Se ja existe um refresh em andamento, enfileira esta requisicao
      // para ser retomada automaticamente quando o refresh concluir
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
        }
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh falhou: dispara evento global de logout que o AuthProvider escuta
        // para limpar estado e redirecionar o usuario
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normaliza erros da API em um formato padrao com code e details
    // para facilitar tratamento especifico (ex: SEAT_LIMIT_REACHED, SLUG_TAKEN)
    const errData = error.response?.data?.error;
    const message = errData?.message || error.message || 'Erro inesperado';
    const apiError = new Error(message) as Error & { code?: string; details?: unknown };
    apiError.code = errData?.code;
    apiError.details = errData?.details;
    return Promise.reject(apiError);
  },
);

// Chave do localStorage para persistir o access token entre recarregamentos de pagina.
// O refresh token fica em cookie httpOnly (mais seguro, nao acessivel via JS).
const TOKEN_KEY = 'accessToken';

/** Salva o access token no localStorage e configura o header Authorization padrao */
export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/** Remove o access token (chamado no logout e quando refresh falha) */
export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common['Authorization'];
}

// Restaura token do localStorage ao carregar o modulo (sobrevive a F5/reload).
// Necessario pois o header Authorization nao persiste entre recarregamentos.
const savedToken = localStorage.getItem(TOKEN_KEY);
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}
