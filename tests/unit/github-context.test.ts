import { getCiContext, affectedIssues, CiContext } from '../../src/github-context';
import * as github from '@actions/github';

// Mock the github context
jest.mock('@actions/github', () => ({
  context: {
    eventName: 'pull_request',
    payload: {
      action: 'opened',
      pull_request: {
        merged: false,
        draft: false,
        base: { ref: 'main' },
        head: { ref: 'feature/TEST-123-new-feature' },
        title: 'TEST-456: Add new feature',
        body: 'This PR implements the new feature described in TEST-789',
        number: 42,
        labels: [{ name: 'bug' }, { name: 'enhancement' }]
      },
      repository: {
        owner: { login: 'stormideas' },
        name: 'jira-automate-transitions'
      }
    }
  }
}));

describe('GitHub Context', () => {
  describe('getCiContext', () => {
    it('should extract context from GitHub payload', () => {
      const context = getCiContext();
      
      expect(context).toEqual({
        event: 'pull_request',
        action: 'opened',
        isMerged: false,
        isDraft: false,
        targetBranch: 'main',
        sourceBranch: 'feature/TEST-123-new-feature',
        title: 'TEST-456: Add new feature',
        body: 'This PR implements the new feature described in TEST-789',
        prNumber: 42,
        labels: ['bug', 'enhancement'],
        repo: {
          owner: 'stormideas',
          name: 'jira-automate-transitions'
        }
      });
    });
  });

  describe('affectedIssues', () => {
    it('should extract issue keys from branch name and title', () => {
      const mockContext: CiContext = {
        event: 'pull_request',
        sourceBranch: 'feature/TEST-123-new-feature',
        title: 'TEST-456: Add new feature',
        body: 'This PR implements the new feature described in TEST-789',
        labels: ['bug', 'enhancement']
      };

      const issues = affectedIssues(mockContext, 'TEST-\\d+');
      
      // Should find TEST-123 from branch and TEST-456 from title
      expect(issues.size).toBe(2);
      expect(issues.has('TEST-123')).toBe(true);
      expect(issues.has('TEST-456')).toBe(true);
      // Should not include TEST-789 from body as it's not checked by the function
      expect(issues.has('TEST-789')).toBe(false);
    });

    it('should handle missing branch name', () => {
      const mockContext: CiContext = {
        event: 'pull_request',
        title: 'TEST-456: Add new feature',
        body: '',
        labels: []
      };

      const issues = affectedIssues(mockContext, 'TEST-\\d+');
      
      expect(issues.size).toBe(1);
      expect(issues.has('TEST-456')).toBe(true);
    });

    it('should throw error if pattern is undefined', () => {
      const mockContext: CiContext = {
        event: 'pull_request',
        title: 'Add new feature',
        body: '',
        labels: []
      };

      expect(() => affectedIssues(mockContext, undefined as unknown as string)).toThrow(
        'pattern to find issue key must be provided'
      );
    });
  });
}); 