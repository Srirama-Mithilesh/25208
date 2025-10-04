
import * as React from 'react';
import { LucideProps } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType<LucideProps>;
  color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between transition-transform transform hover:scale-105">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
    </div>
  );
};

export default KpiCard;