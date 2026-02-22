# HEARTBEAT.md

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.

Read over the following list of tasks, and edit any tasks below task 1 to make this more effective during the next heartbeat.
1. Read over all the rules in ./rules/
2. Implement the "Ideal Plugin" roadmap in the `junie-refactor` branch. Start by refactoring `src/helpers/templates.ts` to use an iterative traversal method with cycle detection to prevent the historical "Max Stack Call" regressions.
3. Develop the `DiscoveryEngine` as a standalone module to handle periodic dashboard scanning and asset registration, replacing the current ad-hoc discovery logic.
4. Integrate the test cards in `tests/test-cards/` into a new automated integration testing suite to verify rendering accuracy against the `tests/test-plan.md` requirements.
5. Review and strengthen TypeScript interfaces and validation for Home Assistant dashboard configurations to ensure robust data handling throughout the rendering pipeline.
6. Create a playwright suite used for automated integration testing, ensuring comprehensive coverage of the plugin's functionality.
7. Update the documentation in `docs_site` to reflect the latest changes and improvements in the plugin. This should include pictures and videos for the demonstration.