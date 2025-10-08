import api from './apiService';

export interface HealthStatus {
  isOnline: boolean;
  latency: number;
  lasCheck: Date;
  error?: string;
  serverInfo?: {
    status: string;
    timestamp: string;
    uptime: number;
    service: string;
  };
}

class HealthService {
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: HealthStatus) => void> = [];

  // Verificar conexão uma vez
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const response = await api.get('/health', {
        timeout: 5000
      });
      const latency = Date.now() - startTime;

      return {
        isOnline: true,
        latency,
        lasCheck: new Date(),
        serverInfo: response.data
      };
    } catch (error: any) {
      return {
        isOnline: false,
        latency: Date.now() - startTime,
        lasCheck: new Date(),
        error: error.message || 'Conection Failed'
      };
    }
  }

  // Ping rápido
  async ping(): Promise<{ success: boolean; latency: number }> {
    const startTime = Date.now();
    try {
      await api.get('/ping', {
        timeout: 3000
      });

      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch {
      return {
        success: false,
        latency: 0
      };
    }
  }

  // Iniciar monitoramento contínuo
  startMonitoring(intervalMs: number = 5000) {
    if(this.checkInterval){
      this.stopMonitoring();
    }

    // Check imediato
    this.checkHealth().then(status => this.notifyListeners(status));

    //Configurar intervalo
    this.checkInterval = setInterval(async () => {
      const status = await this.checkHealth();
      this.notifyListeners(status);
    }, intervalMs)
  }

  stopMonitoring() {
    if(this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  addListener(callback: (status: HealthStatus) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (status: HealthStatus) => void) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  private notifyListeners(status: HealthStatus) {
    this.listeners.forEach(callback => callback(status));
  }
}

export default new HealthService();