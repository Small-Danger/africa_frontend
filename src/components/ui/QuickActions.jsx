import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

const QuickActions = ({ actions, className = "" }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className={`${action.iconColor || 'bg-blue-500'} p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">
                {action.label}
              </span>
              {action.description && (
                <span className="text-xs text-gray-500 text-center mt-1">
                  {action.description}
                </span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
