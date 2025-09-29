import { SwapData, SwapStatus } from '../../interfaces/SwapTask';
import swapInfoController from '../../controller/swap';

export class DatabaseService {
  async getSwapInfo(swapId: string): Promise<SwapData> {
    // Retrieve swap info from database
    const response = await swapInfoController.findOne({ filter: { _id: swapId } });
    
    if (response.status !== 200 || !response.data || response.data.length === 0) {
      throw new Error(`Swap with ID ${swapId} not found`);
    }
    
    return response.data[0];
  }
  
  async updateSwapInfo(swapId: string, updates: Partial<SwapData>): Promise<void> {
    // Update swap info in database
    await swapInfoController.swapUpdate({
      _id: swapId,
      ...updates
    });
  }
  
  async updateSwapStatus(swapId: string, status: string, error?: string): Promise<void> {
    // Update swap status in database
    const updates: any = {
      _id: swapId,
      status
    };
    
    if (error) {
      updates.lastError = {
        message: error,
        timestamp: new Date()
      };
    }
    
    await swapInfoController.swapUpdate(updates);
  }
  
  async getAllActiveSwaps(): Promise<SwapData[]> {
    // Get all active swaps
    const response = await swapInfoController.findOne({ filter: { active: true } });
    
    if (response.status !== 200 || !response.data) {
      return [];
    }
    
    return response.data;
  }
}

export default new DatabaseService();
