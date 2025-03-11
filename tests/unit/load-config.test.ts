import { loadConfig, Config } from '../../src/load-config';
import * as fs from 'fs/promises';
import * as jsyaml from 'js-yaml';

// Mock the fs module
jest.mock('fs/promises');
jest.mock('js-yaml');

describe('loadConfig', () => {
  const mockConfig: Config = {
    connection: {
      host: 'jira.example.com',
      username: 'test-user',
      password: 'test-password'
    },
    rules: [],
    issueKeyRegExp: 'TEST-\\d+',
    syncMilestones: true
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should load and parse the config file', async () => {
    // Setup mocks
    const mockYamlContent = 'yaml-content';
    (fs.readFile as jest.Mock).mockResolvedValue(mockYamlContent);
    (jsyaml.load as jest.Mock).mockReturnValue(mockConfig);

    // Call the function
    const result = await loadConfig('config.yml');

    // Assertions
    expect(fs.readFile).toHaveBeenCalledWith('config.yml', 'utf8');
    expect(jsyaml.load).toHaveBeenCalledWith(mockYamlContent);
    expect(result).toEqual(mockConfig);
  });

  it('should throw an error if the file cannot be read', async () => {
    // Setup mocks
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

    // Call the function and expect it to throw
    await expect(loadConfig('non-existent.yml')).rejects.toThrow('File not found');
  });
}); 