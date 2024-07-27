# Lean Team Health Metrics: Minimal Requirements

## 1. Cycle Time

- Requirement: Team members move items through Shortcut workflow states
- Process: Ensure the team consistently updates item status in Shortcut

## 2. Code Review Time

- Requirement: Team uses Pull Requests (PRs) in GitHub
- Process: Team creates PRs for all changes and merges them when approved

## 3. Pull Request Size

- Requirement: Team uses Pull Requests in GitHub
- Process: No additional process needed; data is inherent in PRs

## 4. Build Success Rate

- Requirement: Automated CI/CD pipeline in GitHub Actions or similar
- Process: Ensure all PRs trigger the CI/CD pipeline

## 5. Bug Resolution Time

- Requirement: Bugs tagged or in a separate workflow in Shortcut
- Process: Team consistently tags bugs or uses a specific workflow for bugs

## 6. Work in Progress (WIP)

- Requirement: Team uses "In Progress" (or equivalent) state in Shortcut
- Process: Team moves items to "In Progress" when actively working on them

## 7. Team Happiness Index

- Requirement: Regular, simple team surveys
- Process: Short, weekly or bi-weekly anonymous surveys (e.g., 1-5 scale)

## Additional Considerations

- Automate data collection where possible (GitHub API, Shortcut integration)
- Use existing tools and integrations to minimize manual data entry
- Regularly review the usefulness of each metric with the team
- Adjust processes based on team feedback to ensure they remain lightweight
