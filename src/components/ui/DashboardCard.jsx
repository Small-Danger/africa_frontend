import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

const DashboardCard = ({ 
  title, 
  children, 
  icon: Icon, 
  iconColor = 'blue',
  className = "",
  onClick = null,
  clickable = false 
}) => {
  const iconColorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500'
  };

  const cardClasses = `
    ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
    ${className}
  `;

  return (
    <Card 
      className={cardClasses}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`${iconColorClasses[iconColor]} p-2 rounded-lg`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
