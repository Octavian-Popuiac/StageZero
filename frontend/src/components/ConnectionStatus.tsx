import React, { useEffect, useState } from "react";
import healthService, { HealthStatus } from "../services/healthService";

interface ConnectionStatusProps {
  showLatency?: boolean;
  compact?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showLatency = false,
  compact = false
}) => {
  const [status, setStatus] = useState<HealthStatus>({
    isOnline: false,
    latency: 0,
    lasCheck: new Date()
  });

  useEffect(() => {
    // Adicionar listener
    const handleStatusChange = (newStatus: HealthStatus) => {
      setStatus(newStatus);
    };

    healthService.addListener(handleStatusChange);
    healthService.startMonitoring(5000); // Verificar a cada 5 segundos

    // Cleanup

    return () => {
      healthService.removeListener(handleStatusChange);
      healthService.stopMonitoring();
    };
  }, []);

  if (compact) {
    return (
      <span className={`connection-dot ${status.isOnline ? 'online' : 'offline'}`}>
        {status.isOnline ? '🟢' : '🔴'}
      </span>
    );
  }

  return (
    <div className={`connection-status ${status.isOnline ? 'online' : 'offline'}`}>
      <span className="status-indicator">
        {status.isOnline ? '🟢' : '🔴'}
      </span>
      <span className="status-text">
        {status.isOnline ? 'Conectado' : 'Desconectado'}
      </span>
      {status.isOnline && showLatency && (
        <span className="latency">
          {status.latency}ms
        </span>
      )}
      {!status.isOnline && status.error && (
        <span className="error-msg" title={status.error}>
          ⚠️
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;