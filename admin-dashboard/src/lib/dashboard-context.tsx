'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, Worker, Customer, Payment, OrderStatus, Service, Package } from '@/types';
import { mockOrders, mockWorkers, mockCustomers, mockPayments, mockServices, mockPackages } from '@/data/mockData';

interface DashboardContextType {
  orders: Order[];
  workers: Worker[];
  customers: Customer[];
  payments: Payment[];
  services: Service[];
  packages: Package[];
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  deleteWorker: (workerId: string) => void;
  updateWorker: (worker: Worker) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (service: Service) => void;
  deleteService: (serviceId: string) => void;
  addPackage: (pkg: Omit<Package, 'id'>) => void;
  updatePackage: (pkg: Package) => void;
  deletePackage: (pkgId: string) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('mawared_orders', mockOrders));
  const [workers, setWorkers] = useState<Worker[]>(() => loadFromStorage('mawared_workers', mockWorkers));
  const [customers] = useState<Customer[]>(mockCustomers);
  const [payments] = useState<Payment[]>(mockPayments);
  const [services, setServices] = useState<Service[]>(() => loadFromStorage('mawared_services', mockServices));
  const [packages, setPackages] = useState<Package[]>(() => loadFromStorage('mawared_packages', mockPackages));

  useEffect(() => { saveToStorage('mawared_orders', orders); }, [orders]);
  useEffect(() => { saveToStorage('mawared_workers', workers); }, [workers]);
  useEffect(() => { saveToStorage('mawared_services', services); }, [services]);
  useEffect(() => { saveToStorage('mawared_packages', packages); }, [packages]);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const addWorker = (worker: Omit<Worker, 'id'>) => {
    setWorkers(prev => [{ ...worker, id: String(Date.now()) }, ...prev]);
  };

  const deleteWorker = (workerId: string) => {
    setWorkers(prev => prev.filter(w => w.id !== workerId));
  };

  const updateWorker = (worker: Worker) => {
    setWorkers(prev => prev.map(w => w.id === worker.id ? worker : w));
  };

  const addService = (service: Omit<Service, 'id'>) => {
    setServices(prev => [{ ...service, id: String(Date.now()) }, ...prev]);
  };

  const updateService = (service: Service) => {
    setServices(prev => prev.map(s => s.id === service.id ? service : s));
  };

  const deleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const addPackage = (pkg: Omit<Package, 'id'>) => {
    setPackages(prev => [{ ...pkg, id: String(Date.now()) }, ...prev]);
  };

  const updatePackage = (pkg: Package) => {
    setPackages(prev => prev.map(p => p.id === pkg.id ? pkg : p));
  };

  const deletePackage = (pkgId: string) => {
    setPackages(prev => prev.filter(p => p.id !== pkgId));
  };

  return (
    <DashboardContext.Provider value={{ orders, workers, customers, payments, services, packages, updateOrderStatus, addWorker, deleteWorker, updateWorker, addService, updateService, deleteService, addPackage, updatePackage, deletePackage }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};
