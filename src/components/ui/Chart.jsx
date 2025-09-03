import React from 'react';

const Chart = ({ 
  data, 
  type = 'line', 
  title, 
  height = 300,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderLineChart();
    }
  };

  const renderLineChart = () => {
    if (!data || data.length === 0) return <div className="text-center text-gray-500 py-8">Aucune donnée disponible</div>;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    
    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <svg className="w-full h-full" viewBox={`0 0 100 ${height}`}>
          {/* Grid lines */}
          {[...Array(5)].map((_, i) => {
            const y = (i * height) / 4;
            return (
              <line
                key={i}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            );
          })}
          
          {/* Line chart */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={data.map((d, i) => {
              const x = (i * 100) / (data.length - 1);
              const y = height - ((d.value - minValue) / range) * height;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {data.map((d, i) => {
            const x = (i * 100) / (data.length - 1);
            const y = height - ((d.value - minValue) / range) * height;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="#3b82f6"
              />
            );
          })}
        </svg>
        
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          {data.map((d, i) => (
            <span key={i} className="text-center">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    if (!data || data.length === 0) return <div className="text-center text-gray-500 py-8">Aucune donnée disponible</div>;
    
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="flex items-end justify-between h-64 space-x-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-500 rounded-t"
              style={{ height: `${(d.value / maxValue) * 200}px` }}
            ></div>
            <span className="text-xs text-gray-500 mt-2 text-center">{d.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderPieChart = () => {
    if (!data || data.length === 0) return <div className="text-center text-gray-500 py-8">Aucune donnée disponible</div>;
    
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;
    
    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {data.map((d, i) => {
            const percentage = d.value / total;
            const angle = percentage * 360;
            const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={i}
                d={pathData}
                fill={`hsl(${(i * 137.5) % 360}, 70%, 60%)`}
                stroke="white"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center space-x-4">
          {data.map((d, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: `hsl(${(i * 137.5) % 360}, 70%, 60%)` }}
              ></div>
              <span className="text-xs text-gray-600">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      {renderChart()}
    </div>
  );
};

export default Chart;
