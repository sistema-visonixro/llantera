// Tipos de datos básicos para mejorar la legibilidad y la seguridad
interface MenuItem {
  id: string;
  label: string;
  children?: MenuItem[];
}

interface Company {
  id: number;
  nombre: string;
  rtn: string;
  // ... otros campos
}

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'cajero' | 'web';
  // ... otros campos
}