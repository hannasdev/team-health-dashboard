# Prompt 1

I'm continuing work on the Team Health Dashboard project.

- Current Focus: Implementing the MetricsController.
- Goal: Create a RESTful API endpoint that returns all metrics aggregated from both GoogleSheetsService and GitHubService.

## Context

- Last implemented: GitHubService and GoogleSheetsService, both of which have a fetchData() method that returns IMetric[].
- Challenge: Deciding on the best way to combine and present data from both services in a single API response.

## Constraints

- Time: Aiming to complete this in a 2-3 hour coding session
- Must use Express.js for the API
- Follow TypeScript and OOP principles
- Maintain test coverage using Jest

## Specific Questions

- How should we structure the API response to clearly differentiate between metrics from different sources?
- What's the best way to handle potential errors or delays from individual services?
- Should we implement any caching mechanism at this stage to improve performance?

## Preferred Approach

- Test-Driven Development (TDD)
- RESTful API best practices
- Error handling and logging

- Next Steps: After implementing the MetricsController, we'll need to set up the Express routes to expose our API endpoint.

Can you guide me through implementing the MetricsController with these considerations in mind, starting with writing the tests?
