import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { BroadcastService } from './broadcast.service';
import { HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { CODE } from '../enums/mqtt-msg.enum';

describe('BroadcastService', () => {
  let service: BroadcastService;
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BroadcastService,
        { provide: HttpService, useValue: mockHttpService },
        
      ],
    }).compile();

    service = module.get<BroadcastService>(BroadcastService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test case for successful access token retrieval
  it('should successfully get access token', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 200, data: { data: { access_token: 'abc123' } } }));

    const token = await service.getAccessToken();
    expect(token).toBe('abc123');
  });

  // Test case for error in getAccessToken
  it('should handle error when getting access token', async () => {
    const error = { response: { data: { error_description: 'Unauthorized' } }, status: 401 };
    mockHttpService.post.mockImplementation(() => throwError(() => new Error('Unauthorized')));

    try {
      await service.getAccessToken();
    } catch (err) {
      expect(err.message).toBe('Error getting access token: Unauthorized');
    }

  });

  // Test case for broadcasting message (successful flow)
  it('should broadcast message successfully', async () => {
    const rrn = '123';
    const money = '1000';
    const imei = 'imei123';

    const token = 'valid-token';
    const rows = [{ identifier: '123' }];
    
    mockHttpService.post
      .mockReturnValueOnce(of({ status: HttpStatus.OK, data: { data: rows } }))  // getRows
      .mockReturnValueOnce(of({ status: HttpStatus.OK }))  // sendNotification

    jest.spyOn(service, 'getAccessToken').mockResolvedValue(token);  // Mock getAccessToken
    await service.broadcastMessage(rrn, money, imei);

    expect(mockHttpService.post).toHaveBeenCalledTimes(2);  // getRows and sendNotification
  });

  // Test case for broadcasting message (no rows)
  it('should log a message if no rows are found during broadcast', async () => {
    const rrn = '123';
    const money = '1000';
    const imei = 'imei123';

    mockHttpService.post.mockReturnValueOnce(of({ status: 200, data: { data: [] } })); // No rows

    await service.broadcastMessage(rrn, money, imei);

  });

  // Test case for broadcasting message (error in getRows)
  it('should handle error during getRows in broadcastMessage', async () => {
    const rrn = '123';
    const money = '1000';
    const imei = 'imei123';
    const token = 'valid-token';
  
    // Mock the getAccessToken to return a valid token
    jest.spyOn(service, 'getAccessToken').mockResolvedValue(token);
  
    // Mock the error in getRows
    mockHttpService.post.mockImplementationOnce(() => throwError(new Error('Error fetching rows')));
  
    // Spy on console.error to check if it's being called
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
    // Call the broadcastMessage method
    await service.broadcastMessage(rrn, money, imei);
  
    // Check that console.error was called with the expected error message
    // The error message passed to console.error will be in the following structure:
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching rows:', new Error('Error fetching rows'));
  
    // Clean up the spy
    consoleErrorSpy.mockRestore();
  });
  

  it('should handle error when adding into blog due to error in sendNotification', async () => {
    const rrn = '123';
    const money = '1000';
    const imei = 'imei123';
  
    // Mock getAccessToken to return a valid token
    jest.spyOn(service, 'getAccessToken').mockResolvedValue('valid-token');
  
    // Mock the HTTP call for adding into blog
    mockHttpService.post.mockReturnValueOnce(of({
      status: 200,
      data: { code: CODE.SUCCESS, message: 'Added to blog' },
    }));
  
    // Mock sendNotification to throw an error
    jest.spyOn(service, 'sendNotification').mockImplementation(() => {
      throw new Error('Error sending notification');
    });
  
    // Spy on console.error to verify if the error is logged
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
    try {
      // Call the addIntoBlog method
      await service.addIntoBlog(rrn, money, imei);
    } catch (err) {
      // Expect the error to be logged
      expect(err.message).toBe('Error adding into blog: Error sending notification');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding into blog: Error sending notification');
    }
  
    // Clean up the spy
    consoleErrorSpy.mockRestore();
  });
    

  // Test case for adding into blog successfully
  it('should successfully add entry into blog', async () => {
    const rrn = '123';
    const money = '1000';
    const imei = 'imei123';
  
    // Mock getAccessToken to return a valid token
    jest.spyOn(service, 'getAccessToken').mockResolvedValue('valid-token');
  
    // Mock the HTTP call for adding into blog (success scenario)
    mockHttpService.post.mockReturnValueOnce(of({
      status: 200,
      data: { code: CODE.SUCCESS, message: 'Added to blog' },
    }));
  
    // Call the addIntoBlog method
    const result = await service.addIntoBlog(rrn, money, imei);
  
    // Verify the response
    expect(result.code).toBe(CODE.SUCCESS);
  });
  

  // Test case for error in adding into blog (400 or 500 error)
  it('should handle error when adding into blog', async () => {
    const rrn = '123';
    const money = '1000';
    const imei = 'imei123';
    jest.spyOn(service, 'getAccessToken').mockResolvedValue('valid-token');
    mockHttpService.post.mockImplementationOnce(() => throwError(new Error('Error adding into blog')));

    try {
      await service.addIntoBlog(rrn, money, imei);
    } catch (error) {
      expect(error.message).toBe('Error adding into blog: Error adding into blog');
    }

  });

  // Test case for adding into blog when rrn starts with "Simulate"
  it('should skip adding into blog if rrn starts with Simulate', async () => {
    const rrn = 'Simulate123';
    const money = '1000';
    const imei = 'imei123';

    const result = await service.addIntoBlog(rrn, money, imei);

    expect(result).toBeUndefined();  // Should not proceed with the API call
  });
});
