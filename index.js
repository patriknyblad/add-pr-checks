const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

const STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

const CONCLUSION = {
  ACTION_REQUIRED: 'action_required', 
  CANCELLED: 'cancelled', 
  FAILURE: 'failure', 
  NEUTRAL: 'neutral', 
  SUCCESS: 'success', 
  SKIPPED: 'skipped', 
  STALE: 'stale', 
  TIMED_OUT: 'timed_out',
};

const parseChecksInPath = async (checksPath) => {
  const globber = await glob.create(checksPath)
  const files = await globber.glob()
  core.debug(`glob result files: ${files}`);

  const checks = files.map((filePath) => {
    const fileName = path.basename(filePath);
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    
    // YAML
    if (fileName.toLowerCase().endsWith('.yaml') || fileName.toLowerCase().endsWith('.yml')) {
      return {
        'id': path.parse(fileName).name,
        ...YAML.parse(fileContents),
      };
    } 
    
    // JSON
    return {
      'id': path.parse(fileName).name,
      ...JSON.parse(fileContents),
    };
  });
  
  return checks;
};

const parseInlineChecks = (inlineChecks) => {
  const checks = YAML.parse(inlineChecks) || [];
  core.debug(`inline checks: ${checks}`);
  return checks.map((check) => ({
    'id': check.name    
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and dashes
          .replace(/\s+/g, '-') // Replace spaces with dashes
          .replace(/-+/g, '-'), // Replace consecutive dashes with a single dash
    ...check,
  })) || [];
};

const execute = async () => {
  const token = core.getInput('token');
  const inlineChecks = core.getInput('checks');
  const checksPath = core.getInput('checks-path');
  const octokit = new github.getOctokit(token);
  core.debug(`checks-path: ${checksPath}`);

  const checks = [
    ...await parseChecksInPath(checksPath),
    ...parseInlineChecks(inlineChecks),
  ];
  core.debug(`parsed checks: ${JSON.stringify(checks, null, 2)}`);

  for (let i in checks) {
    const check = checks[i];
    // If an existing check with the same name exists it will be replaced with the new data when calling `create`
    const checkData = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      head_sha: github.context?.payload?.pull_request?.head?.sha || github.context.sha,
      name: check.name,
      output: {
        title: check.value,
        summary: check.summary,
        text: check.text,
      },
      status: STATUS.COMPLETED,
      conclusion: CONCLUSION.SUCCESS,
    };
    core.debug(`octokit.rest.checks.create(${JSON.stringify(checkData, null, 2)})`);
    await octokit.rest.checks.create(checkData);  
  }
}

execute().catch(error => core.setFailed(error.message));
