import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { KeycloakService } from './keycloak/keycloak.service';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from './winstonlogger/winstonlogger.service';
import Bank_Admin from '../../ui-config/Bank_Admin.json'
import Bank_RM from '../../ui-config/Bank_RM.json'
import DMS_Admin from '../../ui-config/DMS_Admin.json'
describe('UserService', () => {
    let service: UserService;
    let mockKeycloak: any;
    let mockLogger: any;
    
    beforeEach(async () => {
        mockKeycloak = {
            getAccessToken: jest.fn(),
            getUserData: jest.fn(),
            getUserAssociatedClient: jest.fn(),
            getUserAssociatedGroup: jest.fn(),
            logout: jest.fn(),
            getAssocRolesForClient: jest.fn(),
            getGroupMember: jest.fn(),
            updateUserDetails: jest.fn()
        };

        mockLogger = {
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
        };
        

        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             UserService,
                                                                             { provide: KeycloakService, useValue: mockKeycloak },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                             {
                                                                                 provide: ConfigService,
                                                                                 useValue: {
                                                                                     get: jest.fn((key) => {
                                                                                         const map = {
                                                                                             CLIENT_ID: 'client-id',
                                                                                             CLIENT_UUID: 'client-uuid',
                                                                                         };
                                                                                         return map[key];
                                                                                     }),
                                                                                 },
                                                                             },
                                                                         ],
                                                                     }).compile();

        service = module.get<UserService>(UserService);
    });

    describe('Login', () => {
        it('should return error if password is missing', async () => {
            const result = await service.Login({ username: 'test' } as any);
            expect(result.data.message).toBe('PASSWORD REQUIRED');
        });

        it('should return error if username is missing', async () => {
            const result = await service.Login({ password: 'pass' } as any);
            expect(result.data.message).toBe('USERNAME IS REQUIRED');
        });

        it('should return access token on success', async () => {
            mockKeycloak.getAccessToken.mockResolvedValue({ data: 'access-token', status: 200 });
            const result = await service.Login({ username: 'test', password: 'pass' });
            expect(result.data).toBe('access-token');
        });
    });

    describe('getUserDetails', () => {
        it('should return user details with role and group', async () => {
            mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
            mockKeycloak.getUserData.mockResolvedValueOnce({
                                                               code: 200,
                                                               data: [
                                                                   {
                                                                       id: 'user-id',
                                                                       username: 'john',
                                                                       firstName: 'John',
                                                                       lastName: 'Doe',
                                                                       email: 'john@example.com',
                                                                       attributes: {},
                                                                   },
                                                               ],
                                                           });
            mockKeycloak.getUserAssociatedClient.mockResolvedValue({ data: [{ name: 'admin' }] });
            mockKeycloak.getUserAssociatedGroup.mockResolvedValue({ data: [{ name: 'dms' }] });

            const result: any = await service.getUserDetails({ email: 'john@example.com' });
            expect(result.data.code).toBe(2000);
            expect(result.data.data[0].username).toBe('john');
            expect(result.data.data[0].role).toBe('admin');
            expect(result.data.data[0].org).toBe('dms');
        });

        it('should return invalid user when user not found', async () => {
            mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
            mockKeycloak.getUserData.mockResolvedValue({ code: 200, data: [] });

            const result: any = await service.getUserDetails({ email: 'unknown@example.com' });
            expect(result.data.code).toBe(1000);
            expect(result.data.message).toBe('INVALID USER');
        });

        it('should return error when exception occurs', async () => {
            mockKeycloak.getAccessToken.mockRejectedValue(new Error('internal error'));
            const result: any = await service.getUserDetails({ email: 'error@example.com' });
            expect(result.status).toBe(500);
            expect(result.data.code).toBe(4000);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('should logout successfully', async () => {
            mockKeycloak.logout.mockResolvedValue({ data: { message: 'User logged out successfully.' }, status: 200 });
            const result = await service.logout('token');
            expect(result.data.message).toBe('User logged out successfully.');
        });
    });

    describe('getRoles', () => {
        it('should return roles when successful', async () => {
            mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
            mockKeycloak.getAssocRolesForClient.mockResolvedValue({ status: 200, data: { data: ['admin', 'rm'] } });

            const result = await service.getRoles();
            expect(result.data.data).toContain('admin');
        });

        it('should handle no roles found case', async () => {
            mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
            mockKeycloak.getAssocRolesForClient.mockResolvedValue({ status: 404 });

            const result = await service.getRoles();
            expect(result.data.message).toBe('NO ROLES');
        });

        it('should handle exception in getRoles', async () => {
            mockKeycloak.getAccessToken.mockRejectedValue(new Error('DB down'));
            await expect(service.getRoles()).rejects.toThrow('DB down');
        });
    });

    describe('forgotPassword', () => {
        it('should validate missing fields', async () => {
            const res1:any = await service.forgotPassword({ userName: 'abc' });
            expect(res1.data.message).toBe('NEW PASSWORD REQUIRED');

            const res2:any = await service.forgotPassword({ newPassword: 'abc' });
            expect(res2.data.message).toBe('USERNAME IS REQUIRED');
        });

        it('should return error for unknown user', async () => {
            mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
            mockKeycloak.getUserData.mockResolvedValue({ code: 200, data: [] });

            const result:any = await service.forgotPassword({ newPassword: 'pass', userName: 'john' });
            expect(result.data.message).toBe('INVALID USER');
        });

        it('should reset password successfully', async () => {
            mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
            mockKeycloak.getUserData.mockResolvedValue({ code: 200, data: [{ id: 'user123' }] });
            mockKeycloak.resetPassword = jest.fn().mockResolvedValue({ status: 200, data: { message: 'updated' } });

            const result:any = await service.forgotPassword({ newPassword: 'pass', userName: 'john' });
            expect(result.data.message).toBe('updated');
        });

        it('should handle internal error gracefully', async () => {
            mockKeycloak.getAccessToken.mockRejectedValue(new Error('unexpected'));

            const result:any = await service.forgotPassword({ userName: 'john', newPassword: '123' });
            expect(result.data.code).toBe(4000);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('getUserListByOrg', () => {
        it('should return error if orgname is not provided', async () => {
          const result = await service.getUserListByOrg({});
          expect(result).toEqual({
            status: 200,
            data: {
              code: 1000,
              message: "ORG NAME IS REQUIRED"
            }
          });
        });
      
        it('should return User Not Found for orgname "dms" with count 0', async () => {
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getUserData.mockResolvedValueOnce({ data: 0 }); // count
      
          const result = await service.getUserListByOrg({ orgname: 'dms' });
      
          expect(result).toEqual({
            status: 200,
            data: {
              code: 4000,
              message: "INVALID USER"
            }
          });
        });
      
        it('should return user list for orgname "dms" with users available', async () => {
          const userList = [{ id: 1, username: 'john', firstName: 'John', lastName: 'Doe' }];
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getUserData
            .mockResolvedValueOnce({ data: 1 }) // count
            .mockResolvedValueOnce({ data: userList }); // user data
      
          const result = await service.getUserListByOrg({ orgname: 'dms' });
            expect(result?.status).toEqual(200)
            expect(result?.data.code).toEqual(2000)
            expect(result?.data.data).toEqual(userList)
            expect(result?.data?.count).toEqual(userList.length)
        });
      
        it('should return user list for non-dms group with data', async () => {
          const groupName = 'custom-group';
          const userList = [{ id: 2, username: 'alice', firstName: 'Alice', lastName: 'Smith' }];
          
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getGroupMember
            .mockResolvedValue({ code: 2000, data: userList })  // count call
            .mockResolvedValueOnce({ code: 2000, data: userList }); // paginated call
      
          const result = await service.getUserListByOrg({ orgname: groupName });
      
          expect(result?.status).toBe(200);
          expect(result?.data.code).toBe(2000);
          expect(result?.data.data).toEqual(userList);
          expect(result?.data.count).toBe(userList.length);
        });
      
        it('should return 400 if non-dms group returns code 4000', async () => {
            const groupName = 'custom-group';
          
            mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          
            mockKeycloak.getGroupMember.mockResolvedValueOnce({
              code: 4000, message: "Organization does not exist"

            });
            
          
            const result = await service.getUserListByOrg({ orgname: groupName });
          
            expect(result).toEqual({
              status: 400,
              data: {
                code: 4000,
                message: {
                  code: 4000,
                  message: "Organization does not exist"
                }
              }
            });
            
            
          });
          
      
        it('should handle internal error and return 500', async () => {
          const error = new Error('Internal Server Error');
          mockKeycloak.getAccessToken.mockRejectedValue(error);
      
          const result = await service.getUserListByOrg({ orgname: 'dms' });  
      
         
          expect(result).toEqual({
            status: 500,
            data: {
              code: 4000,
              message: 'Internal Server Error'
            }
          });
        });
      });
    
      describe('updateUserDetails', () => {
        const mockUserInfo = {
          firstName: 'OldFirst',
          lastName: 'OldLast',
          enabled: true,
        };
      
        const userId = 'user-123';
      
        beforeEach(() => {
          mockKeycloak.getAccessToken.mockReset();
          mockKeycloak.getUserData.mockReset();
          mockKeycloak.updateUserDetails.mockReset();
        });
      
        it('should successfully update user details and return USER_UPDATED', async () => {
          const body = { userId: 'user-123', fname: 'NewFirst', lname: 'NewLast', enable: false };
        
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getUserData.mockResolvedValue({ data: {} });
          mockKeycloak.updateUserDetails.mockResolvedValue({ status: 200 });
        
          const edata = {
            status: [1, 1, 0],
            values: [['user-123', 'USER_UPDATED', 1]],
            headers: ['userId', 'msg', 'status'],
          };
        
          const result = await service.updateUserDetails(body);
        
          expect(result).toEqual({
            status: 200,
            data: {
              code: 2000,
              data: edata,    // <-- present due to RESPONSE_FIELDS defaulting to 'data'
              edata: edata    // <-- present due to extras param
            }
          });
        });
        
      
        it('should return failure response if update API fails (non-200)', async () => {
          const body = { userId: 'user-123', fname: 'NewFirst', enable: false };
        
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getUserData.mockResolvedValue({ data: {} });
          mockKeycloak.updateUserDetails.mockResolvedValue({ status: 500 });
        
          const edata = {
            status: [1, 0, 1],
            values: [['user-123', 'USER_UPDATION_FAILED', 0]],
            headers: ['userId', 'msg', 'status'],
          };
        
          const result = await service.updateUserDetails(body);
        
          expect(result).toEqual({
            status: 200,
            data: {
              code: 4000,
              message: edata,
              edata: edata
            }
          });
        });
        
      
        it('should return USER_UPDATED message when enable flag is not passed', async () => {
          const body = { userId: 'user-123', fname: 'NewFirst' };
        
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getUserData.mockResolvedValue({ data: {} });
          mockKeycloak.updateUserDetails.mockResolvedValue({ status: 200 });
        
          const edata = {
            status: [1, 1, 0],
            values: [['user-123', 'USER_UPDATED', 1]],
            headers: ['userId', 'msg', 'status'],
          };
        
          const result = await service.updateUserDetails(body);
        
          expect(result).toEqual({
            status: 200,
            data: {
              code: 2000,
              data: edata,
              edata: edata
            }
          });
        });
        
      
        it('should return USER_UPDATION_FAILED if exception occurs', async () => {
          const body = { userId: 'user-123', fname: 'FailingUser' };
        
          mockKeycloak.getAccessToken.mockRejectedValue(new Error('token error'));
        
          const edata = {
            status: [1, 0, 1],
            values: [['user-123', 'USER_UPDATION_FAILED', 0]],
            headers: ['userId', 'msg', 'status'],
          };
        
          const result = await service.updateUserDetails(body);
        
          expect(result).toEqual({
            status: 400,
            data: {
              code: 4000,
              message: edata,
              edata: edata
            }
          });
        });
        
      
        it('should return USER_DEACTIVATION_FAILED if enable is true and exception occurs', async () => {
          const body = { userId: 'user-123', enable: true };
        
          mockKeycloak.getAccessToken.mockRejectedValue(new Error('token error'));
        
          const edata = {
            status: [1, 0, 1],
            values: [['user-123', 'USER_DEACTIVATION_FAILED', 0]],
            headers: ['userId', 'msg', 'status'],
          };
        
          const result = await service.updateUserDetails(body);
        
          expect(result).toEqual({
            status: 400,
            data: {
              code: 4000,
              message: edata,
              edata: edata
            }
          });
        });
        
      });
      
    
      describe('searchUser', () => {
        const userId = 'user-123';
        const token = 'valid-token';
      
        const defaultUser = { id: 1, username: 'john', firstName: 'John', lastName: 'Doe' };
      
        beforeEach(() => {
          mockKeycloak.getAccessToken.mockReset();
          mockKeycloak.getUserData.mockReset();
          mockKeycloak.getGroupMember.mockReset();
        });
      
        it('should return error if orgname is not provided', async () => {
          const result = await service.searchUser(token, { userName: 'john' });
      
          expect(result).toEqual({
            status: 200,
            data: {
              code: 1000,
              message: 'ORG NAME IS REQUIRED'
            }
          });
        });
      
        it('should return error if userName is not provided', async () => {
          const result = await service.searchUser(token, { orgname: 'dms' });
      
          expect(result).toEqual({
            status: 200,
            data: {
              code: 1000,
              message: 'USERNAME IS REQUIRED'
            }
          });
        });
      
        it('should return error if userName is empty', async () => {
          const result = await service.searchUser(token, { orgname: 'dms', userName: '' });
      
          expect(result).toEqual({
            status: 200,
            data: {
              code: 1000,
              message: 'USERNAME IS REQUIRED'
            }
          });
        });
      
        it('should return user data for orgname "dms" with user found', async () => {
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getUserData
            .mockResolvedValueOnce({ data: 1 }) // count call
            .mockResolvedValueOnce({ data: [defaultUser] }); // user data
      
          const result = await service.searchUser(token, { orgname: 'dms', userName: 'john' });
      
          expect(result?.status).toBe(200);
          expect(result?.data.code).toBe(2000);
          expect(result?.data.count).toBe(1);
          expect(result?.data.data).toEqual([defaultUser]);
        });
      
        it('should return "User Not Found" for orgname "dms" with count = 0', async () => {
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getUserData.mockResolvedValue({ data: 0 });
      
          const result = await service.searchUser(token, { orgname: 'dms', userName: 'john' });
      
          expect(result).toEqual({
            status: 200,
            data: {
              code: 4000,
              message: 'USER IS NOT CREATED'
            }
          });
        });
      
        it('should return matched users for non-dms org with matching usernames', async () => {
          const groupUsers = [
            { id: 1, username: 'john.doe', firstName: 'John', lastName: 'Doe' },
            { id: 2, username: 'alice.smith', firstName: 'Alice', lastName: 'Smith' },
          ];
      
          const matchedUsers = [groupUsers[0]];
      
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getGroupMember.mockResolvedValue({ code: 2000, data: groupUsers });
      
          // Inject mock for `searchUsers` and `getSelectedFields`
          service.searchUsers = jest.fn().mockResolvedValue(matchedUsers);
          service.getSelectedFields = jest.fn().mockResolvedValue(matchedUsers);
      
          const result = await service.searchUser(token, { orgname: 'custom-group', userName: 'john' });
      
          expect(result?.status).toBe(200);
          expect(result?.data.code).toBe(2000);
          expect(result?.data.data).toEqual(matchedUsers);
          expect(result?.data.count).toBe(1);
        });
      
        it('should return 400 if groupMember API returns 4004', async () => {
          mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
          mockKeycloak.getGroupMember.mockResolvedValue({
            code: 4004,
            message: 'Group not found'
          });
      
          const result = await service.searchUser(token, { orgname: 'invalid-group', userName: 'any' });
      
          expect(result).toEqual({
            status: 400,
            data: {
              code: 4004,
              message: 'Group not found'
            }
          });
        });
      
        it('should handle internal error and return 500', async () => {
          mockKeycloak.getAccessToken.mockRejectedValue(new Error('token fetch error'));
      
          const result = await service.searchUser(token, { orgname: 'dms', userName: 'john' });
      
          expect(mockLogger.error).toHaveBeenCalledWith('token fetch error');
          expect(result).toEqual({
            status: 500,
            data: {
              code: 4000,
              message: 'token fetch error'
            }
          });
        });
      });

      describe('getUiRolePermisssions', () => {

        it('should return 1000 if role is not provided', async () => {
          const result = await service.getUiRolePermisssions({});
          expect(result).toEqual({
            status: 200,
            data: {
              code: 1000,
              message: "USER ROLE REQUIRED"
            }
          });
        });
      
        it('should return 4000 if role is invalid', async () => {
          const result = await service.getUiRolePermisssions({ role: 'InvalidRole' });
          expect(result).toEqual({
            status: 200,
            data: {
              code: 4000,
              message: "INVALID ROLE"
            }
          });
        });
      
        it('should return correct permissions for Bank Admin', async () => {
          const result = await service.getUiRolePermisssions({ role: 'Bank Admin' });
          expect(result).toEqual({
            status: 200,
            data: {
              code: 2000,
              data: Bank_Admin
            }
          });
        });
      
        it('should return correct permissions for Bank RM', async () => {
          const result = await service.getUiRolePermisssions({ role: 'Bank RM' });
          expect(result).toEqual({
            status: 200,
            data: {
              code: 2000,
              data: Bank_RM
            }
          });
        });
      
        it('should return correct permissions for DMS Admin', async () => {
          const result = await service.getUiRolePermisssions({ role: 'DMS Admin' });
          expect(result).toEqual({
            status: 200,
            data: {
              code: 2000,
              data: DMS_Admin
            }
          });
        });
      
        it('should handle exception and log error', async () => {
          const faultyService = {
            wl: mockLogger,
            getUiRolePermisssions: service.getUiRolePermisssions
          };
      
          // Temporarily inject a bug by mocking body.role to throw error
          const erroringBody = new Proxy({}, {
            get: () => { throw new Error("Simulated failure") }
          });
      
          const result = await faultyService.getUiRolePermisssions(erroringBody);
      
          expect(mockLogger.error).toHaveBeenCalledWith("Simulated failure");
        });
      });

      describe('firebaseConfig', () => {

        afterEach(() => {
          delete process.env.FIREBASE_CONFIG; // cleanup after each test
        });
      
        it('should return firebase config if FIREBASE_CONFIG is set', async () => {
          const configObject = { projectId: "abc", apiKey: "xyz" };
          process.env.FIREBASE_CONFIG = JSON.stringify(configObject);
      
          const result = await service.firebaseConfig();
      
          expect(result).toEqual({
            status: 200,
            data: {
              code: 2000,
              data: configObject
            }
          });
        });
      
        it('should return error response if FIREBASE_CONFIG is not set', async () => {
          delete process.env.FIREBASE_CONFIG;
      
          const result = await service.firebaseConfig();
      
          expect(result).toEqual({
            status: 400,
            data: {
              code: 4000,
              message: "NO DATA"
            }
          });
        });
      
        it('should return error response if FIREBASE_CONFIG is invalid JSON', async () => {
          process.env.FIREBASE_CONFIG = "{invalid-json";
      
          const result = await service.firebaseConfig();
      
          expect(mockLogger.error).toHaveBeenCalled();
          expect(result.status).toBe(400);
          expect(result.data.code).toBe(4000);
        });
      
      });
      
      
      
      
      
});
