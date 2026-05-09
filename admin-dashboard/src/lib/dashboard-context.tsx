'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Order, Worker, Customer, Payment, OrderStatus } from '@/types';
import { mockOrders, mockWorkers, mockCustomers, mockPayments } from '@/data/mockData';

interface DashboardContextType {
  orders: Order[];
  workers: Worker[];
  customers: Customer[];
  payments: Payment[];
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  deleteWorker: (workerId: string) => void;
  updateWorker: (worker: Worker) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [workers, setWorkers] = useState<Worker[]>(mockWorkers);
  const [customers] = useState<Customer[]>(mockCustomers);
  const [payments] = useState<Payment[]>(mockPayments);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const addWorker = (worker: Omit<Worker, 'id'>) => {
    setWorkers(prev => [...prev, { ...worker, id: String(prev.length + 1) }]);
  };

  const deleteWorker = (workerId: string) => {
    setWorkers(prev => prev.filter(w => w.id !== workerId));
  };

  const updateWorker = (worker: Worker) => {
    setWorkers(prev => prev.map(w => w.id === worker.id ? worker : w));
  };

  return (
    <DashboardContext.Provider value={{ orders, workers, customers, payments, updateOrderStatus, addWorker, deleteWorker, updateWorker }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};
