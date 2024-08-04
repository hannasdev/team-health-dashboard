/**
 * Represents a Pull Request in GitHub.
 */
export interface IPullRequest {
  id: number;

  number: number;

  title: string;

  /** The current state of the pull request (open, closed, merged) */
  state: 'open' | 'closed' | 'merged';

  /** The login of the user who created the pull request */
  user: {
    login: string;
  };

  created_at: string;

  updated_at: string;

  /** The date and time when the pull request was closed (if applicable) */
  closed_at: string | null;

  /** The date and time when the pull request was merged (if applicable) */
  merged_at: string | null;

  /** The number of commits in the pull request */
  commits: number;

  /** The number of added lines in the pull request */
  additions: number;

  /** The number of deleted lines in the pull request */
  deletions: number;

  /** The number of changed files in the pull request */
  changed_files: number;

  /** The base branch of the pull request */
  base: {
    ref: string;
    sha: string;
  };

  /** The head branch of the pull request */
  head: {
    ref: string;
    sha: string;
  };
}
