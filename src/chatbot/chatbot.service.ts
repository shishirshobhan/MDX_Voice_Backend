
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class ChatbotService {
  private readonly pythonScript: string;

  constructor() {
    // Path to your Python script
    this.pythonScript = join(
      process.cwd(),
      '././microservices/chatbot_core.py',
    );
  }

  private async executePython(command: string, data: any): Promise<any> {
    try {
      const dataJson = JSON.stringify(data).replace(/"/g, '\\"');
      const cmd = `python3 "${this.pythonScript}" "${command}" "${dataJson}"`;

      const { stdout, stderr } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes('Warning')) {
        console.error('Python stderr:', stderr);
      }

      return JSON.parse(stdout);
    } catch (error) {
      console.error('Python execution error:', error);
      throw new HttpException(
        {
          success: false,
          error: 'Chatbot service error',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async startChat(sessionId?: string) {
    return this.executePython('start', {
      session_id: sessionId || `session_${Date.now()}`,
    });
  }

  async sendMessage(sessionId: string, message: string) {
    return this.executePython('message', {
      session_id: sessionId,
      message: message,
    });
  }

  async getResources() {
    return this.executePython('resources', {});
  }

  async healthCheck() {
    try {
      // Check if Python and Ollama are available
      await execAsync('python3 --version');
      await execAsync('ollama list');
      
      return {
        status: 'healthy',
        python: 'available',
        ollama: 'available',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        python: 'check failed',
        message: error.message,
      };
    }
  }
}

