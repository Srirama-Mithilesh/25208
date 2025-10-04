import { ElementType, FC } from 'react';
import { LucideProps } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: ElementType<LucideProps>;
  color: string;
}

const KpiCard: FC<KpiCardProps> = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between transition-transform transform hover:scale-105">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
      </div>
      <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
    </div>
  );
};

export default KpiCard;