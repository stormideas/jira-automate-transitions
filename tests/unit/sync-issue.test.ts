import { syncIssue } from '../../src/sync-issue';
import { CiContext } from '../../src/github-context';
import { Config } from '../../src/load-config';

// Create mock functions for the JIRA API
const mockTransitionIssue = jest.fn().mockResolvedValue({});
const mockGetIssue = jest.fn()
  .mockImplementationOnce(() => Promise.resolve({
    fields: {
      status: { name: 'Open' },
      fixVersions: []
    }
  }))
  .mockImplementationOnce(() => Promise.resolve({
    fields: {
      status: { name: 'In Progress' }
    }
  }))
  .mockImplementation(() => Promise.resolve({
    fields: {
      status: { name: 'Open' },
      fixVersions: []
    }
  }));

const mockListTransitions = jest.fn().mockResolvedValue({
  transitions: [
    { id: '1', name: 'Start Progress' },
    { id: '2', name: 'Close' }
  ]
});

// Mock the jira-client module
jest.mock('jira-client', () => {
  return function() {
    return {
      getIssue: mockGetIssue,
      listTransitions: mockListTransitions,
      transitionIssue: mockTransitionIssue,
      updateIssue: jest.fn().mockResolvedValue({})
    };
  };
});

// Mock process.env to avoid using real tokens
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.JIRA_API_TOKEN;
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock console.log to avoid cluttering test output
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('sync-issue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncIssue', () => {
    // Temporarily skipping this test until we can fix the mocking issue
    it('should call the Jira API with correct parameters', async () => {
      // Setup
      const issueKey = 'TEST-123';
      const ciCtx: CiContext = {
        event: 'pull_request',
        action: 'opened',
        targetBranch: 'main',
        title: 'Test PR',
        body: '',
        labels: ['bug']
      };
      
      const config: Config = {
        connection: {
          host: 'jira.example.com',
          username: 'test-user',
          password: 'test-password'
        },
        rules: [
          {
            from: ['Open'],
            transition: 'Start Progress',
            on: {
              pull_request: {
                actions: ['opened'],
                targetBranches: ['main']
              }
            }
          }
        ],
        issueKeyRegExp: 'TEST-\\d+'
      };
      
      // Act
      await syncIssue(issueKey, ciCtx, config);
      
      // Assert
      expect(mockGetIssue).toHaveBeenCalledWith('TEST-123', ['status', 'fixVersions']);
      expect(mockListTransitions).toHaveBeenCalledWith('TEST-123');
      
      // Check that transitionIssue was called with the correct parameters
      expect(mockTransitionIssue).toHaveBeenCalledTimes(1);
      expect(mockTransitionIssue.mock.calls[0][0]).toBe('TEST-123');
      expect(mockTransitionIssue.mock.calls[0][1]).toEqual({
        transition: { id: '1' }
      });
    });
    
    it('should not transition if no matching rule is found', async () => {
      // Setup
      const issueKey = 'TEST-123';
      const ciCtx: CiContext = {
        event: 'pull_request',
        action: 'closed',  // Different action than in the rule
        targetBranch: 'main',
        title: 'Test PR',
        body: '',
        labels: []
      };
      
      const config: Config = {
        connection: {
          host: 'jira.example.com',
          username: 'test-user',
          password: 'test-password'
        },
        rules: [
          {
            from: ['Open'],
            transition: 'Start Progress',
            on: {
              pull_request: {
                actions: ['opened'],
                targetBranches: ['main']
              }
            }
          }
        ],
        issueKeyRegExp: 'TEST-\\d+'
      };
      
      // Act
      await syncIssue(issueKey, ciCtx, config);
      
      // Assert
      expect(mockGetIssue).toHaveBeenCalledWith('TEST-123', ['status', 'fixVersions']);
      expect(mockListTransitions).toHaveBeenCalledWith('TEST-123');
      expect(mockTransitionIssue).not.toHaveBeenCalled();
    });
  });
}); 