import { validateEnv, type EnvConfig } from './env.config';

export default (): EnvConfig => {
  return validateEnv(process.env);
};
