# Meta PyTorch OpenEnv Hackathon Instructions

This document consolidates the downloaded Google Docs, Google Slides, Scaler page, the main opening deck, and the extra text provided in the prompt. It is intended to be a single working guide for understanding the hackathon, choosing a topic, building the project, preparing training evidence, and submitting correctly.

Note: the requested filename is intentionally spelled `hackathon_instrcutions.md`.

## Source files in this folder

Raw downloaded files are in `hackathon_instructions/downloads/`.

Key sources:

- `doc_1_problem_or_theme_a.*`: official resources and materials.
- `doc_2_problem_or_theme_b.*`: RL, reward engineering, RLVR/RLVE, GRPO, and common pitfalls FAQ.
- `doc_3_problem_or_theme_c.*`: self-serve guide for building an RL environment, training an LLM, and shipping a demo.
- `doc_4_problem_or_theme_d.*`: hackathon themes, judging criteria, minimum submission requirements, and what judges look for.
- `doc_5_extra_instructions.*`: participant registration and campus entry guide.
- `slides_1_extra.*`: event flow, submission links, and judging criteria.
- `slides_2_main_opening.pdf`: main OpenEnv Hackathon opening ceremony deck.
- `ondaypdf.pdf`: local copy of the main deck from the working directory.
- `OpenEnv_Hackathon_Opening_Ceremony_25_Apr.pdf`: earlier local copy of the main deck.
- `site/scaler_meta_pytorch_hackathon.html` and `.txt`: Scaler hackathon landing page.

Extracted text, page renders, and image assets are in:

- `hackathon_instructions/extracted/`
- `hackathon_instructions/images/`
- `hackathon_instructions/text/`
- `hackathon_instructions/extraction_summary.json`
- `hackathon_instructions/source_manifest.json`

Extraction summary:

- 9 PDFs processed.
- 5 DOCX files processed.
- 1 PPTX processed.
- Main deck: 81 pages/slides.
- Extra submission deck: 8 pages/slides.
- Site images downloaded: 59.
- Main deck embedded image references: 138 per main PDF copy, with 105 unique extracted image objects per copy.

The main Google Slides PPTX export failed due a Google export/network error, but the PDF export succeeded and the local `ondaypdf.pdf` copy is present.

## What the hackathon is

The event is the Meta PyTorch OpenEnv Hackathon x Scaler School of Technology. It is a national AI hackathon focused on building reinforcement-learning environments for LLMs and agents using OpenEnv. The core goal is not just to fine-tune a model on static text, but to build an environment where an LLM can act, receive feedback, improve through reinforcement learning, and demonstrate measurable capability gains.

The practical stack described across the materials is:

1. Environment design.
2. Verifiers and reward functions.
3. OpenEnv as the standard environment interface.
4. TRL for RL training, especially GRPO-style workflows.
5. Unsloth for efficient training and inference.
6. Hugging Face Spaces for deployment and discoverability.
7. A README, demo, blog/video, and plots that prove the model improved.

The opening deck frames the objective as:

- Learn RL.
- Hack and create environments that add skills to models.
- Showcase the work on Hugging Face Hub.
- Build something ambitious, measurable, and interesting.

The Scaler page describes OpenEnv as an open-source framework by Meta and Hugging Face for creating standardized, isolated, reusable environments for training and deploying AI agents. It uses a Gymnasium-style API, containerized execution via Docker, and a central Hugging Face hub for sharing environments.

## High-level event timeline

From the Scaler page:

- Registration window: Saturday, 14 March to Sunday, 5 April 2026.
- Round 1: Wednesday, 25 March to Sunday, 12 April 2026.
- Round 1 results: Friday, 10 April and Tuesday, 14 April 2026.
- Grand finale: Saturday, 25 April to Sunday, 26 April 2026, at Scaler School of Technology, Bangalore.
- Team size: solo or teams of up to 3 members.
- Prize pool: 30,000 USD.
- Final winners receive interview opportunities with Meta and Hugging Face AI teams.

From the main opening deck:

- Top-100 finalist announcement: Friday, May 1.
- Winners livestream: Friday, May 8.

## Onsite Day 1 schedule

The extra slide deck gives a fuller Day 1 flow:

- 7:00 AM to 10:30 AM: registration and arrival at registration desk, Scaler campus.
- 8:00 AM to 9:15 AM: breakfast at food zones.
- 10:00 AM to 10:15 AM: opening ceremony at main stage.
- 10:15 AM to 10:30 AM: address by Meta team at main stage.
- 10:30 AM to 11:00 AM: problem themes overview and briefing at main stage.
- 11:00 AM to 11:30 AM: move to build zones, all classrooms.
- 11:30 AM: hacking begins in all classrooms.
- 1:00 PM: lunch, food zone on all floors.
- 3:30 PM to 4:30 PM: mentor round 1, all classrooms.
- 5:00 PM to 5:30 PM: talk plus high tea at main stage.
- 8:00 PM to 10:00 PM: dinner, food zone on all floors.
- 9:30 PM: mentor round 2, all classrooms.
- 2:00 AM: midnight snacks, food zone on all floors.

The main opening deck also lists the Day 1 items from 11:00 AM onward: hacking begins, lunch, mentor rounds, talk/high tea, dinner, and midnight snacks.

## Onsite Day 2 schedule

From the extra slide deck:

- 8:00 AM: breakfast at food zones.
- 10:00 AM to 12:00 PM: 5-hour reminder for submission deadline, all classrooms.
- 12:00 PM: lunch, food zone on all floors.
- 2:00 PM: mentor round 3, final mentor round, all classrooms.
- 3:00 PM: 2-hour reminder for submission deadline, all classrooms.
- 3:30 PM to 4:30 PM: closing remarks at main stage.
- 5:00 PM: submission deadline.
- 5:15 PM: event concludes near main stage.
- 5:30 PM to 8:00 PM: open networking near main stage.

The submission deadline is the central hard stop. The materials emphasize that changes or commits after the submission deadline will not be considered.

## Participant registration and campus entry

Only registered participants are allowed entry. Parents, friends, mentors, and external guests are not permitted on campus.

Documents to carry:

- Team leaders or solo participants: confirmation email with ticket, government-issued ID, and college/organization ID.
- Team members: government-issued ID and college/organization ID.
- Team members do not need the confirmation email; verification is by registered name and email ID.

Registration flow:

1. Enter campus and go to the waiting area.
2. Volunteers direct you to a registration counter.
3. Your registration and ID are verified.
4. If there is a mismatch, it goes to the help desk.
5. You receive a zone wristband.
6. You proceed to the opening ceremony and later to your assigned classroom/build zone.
7. You collect an ID card when entering classrooms.

Wristband rules:

- Wear it immediately.
- Do not remove it.
- It is needed for moving across zones and accessing food areas.
- Only one replacement is allowed, and the old band must be returned even if broken.

Wristband color mapping:

- Red: ground floor.
- Blue: first floor.
- Yellow: second floor.
- Purple: fifth floor and basketball court.
- Green: volunteers only.

Breakfast and late entry:

- Breakfast for early arrivals is available until 9:00 AM only, distributed in classroom areas after verification.
- No breakfast is provided after 9:00 AM.
- Late entry is from 9:15 AM to 10:30 AM via the Tap House Gate.
- Final entry cutoff is 10:30 AM. No entries after that.
- Opening ceremony starts at 10:00 AM.
- No re-entry without the ID card.

## Conduct and Discord rules

The Discord/community guidelines are serious. The main deck states that global tech leaders and executives are present in the community, so participants must maintain professionalism and decorum.

Practical interpretation:

- Keep questions professional.
- Do not spam mentors or organizers.
- Read posted do's and don'ts.
- Follow channel-specific instructions.
- Violations may lead to strict action and may affect hackathon participation.

## Credits and compute

The main deck instructs participants to get credits early.

Cursor AI credits:

- Each participant is eligible for Cursor credits.
- Use the Scaler Hackathon dashboard: https://tinyurl.com/sclr-openenv-dashboard

Hugging Face credits:

- 30 USD credit per person.
- Claim link: https://huggingface.co/coupons/claim/hf-openenv-community

Hugging Face Jobs:

- Jobs can run AI and data workflows.
- Jobs can be launched through the `hf` CLI, `huggingface_hub` Python client, or Jobs HTTP API.
- Hardware can range from CPU to H100 and TPU, with pay-as-you-go.
- Suggested default GPU for small or medium runs: T4 small/medium, chosen carefully so the team can train and run inference within credit limits.

Useful HF Jobs links from the deck:

- https://huggingface.co/settings/billing
- https://huggingface.co/settings/jobs
- https://huggingface.co/docs/hub/jobs
- https://huggingface.co/docs/huggingface_hub/guides/cli#hf-jobs
- https://huggingface.co/docs/huggingface_hub/guides/jobs
- https://huggingface.co/docs/hub/jobs-pricing
- https://huggingface.co/docs/hub/jobs-examples

## Mentors mentioned in the opening deck

Mentors listed in the main deck:

- Yash Khare, Partner Engineer, Meta.
- Sanyam Bhutani, Partner Engineer, Meta.
- Nilesh Pandey, Partner Engineer, Meta.
- Adithya S Kolavi, Engineer, Hugging Face.
- Adarsh Shirawalmath, ML Engineer, Hugging Face.
- Arkadip Maitra, ML Engineer, Red Hat.
- Aashay Sachdeva, Founding Team, Sarvam.
- Deepa Dhevannan, Gen AI Solution Architect.
- Soumik Rakhsit, ML Engineer, Zomato.
- Parshant Sharma, ML Engineer, Red Hat.
- Ayush Satyam, ML Engineer, Red Hat.
- Ben Burtenshaw, Community Education AI, Hugging Face, remotely available.
- Alireza Shamsoshoara, PyTorch, Meta, remotely available.

## The central build goal

Build an OpenEnv-compliant environment that an LLM can use to get measurably better at a capability.

A strong project should show:

- A concrete capability gap.
- An environment where the model acts step by step.
- A programmatic verifier or reward signal.
- A training pipeline that connects to the environment, not just a static dataset.
- Evidence that reward or task performance improved.
- A clear explanation of the environment, reward design, results, and why the problem matters.

The judges prefer a messy but ambitious environment with real training evidence over a polished but boring clone.

## Theme 1: Multi-Agent Interactions

This theme is about environments involving cooperation, competition, negotiation, and coalition formation.

What the environment should teach:

- Modeling other agents' beliefs and incentives.
- Acting under partial observability.
- Strategic reasoning.
- Theory-of-mind behavior.
- Coordination and conflict resolution.

Expected outcome:

- An environment that can train multi-agent task handling in an LLM.

Example environment directions:

- Market simulations.
- Compute-allocation negotiations.
- Collaborative puzzle worlds.
- Mixed cooperative/competitive strategy games.
- Multi-agent strategy games with incomplete information and evolving rules.
- Customer or stakeholder simulations where multiple agents have conflicting goals.

What would make this strong:

- Agents have private information, goals, or incentives.
- Success requires modeling other actors rather than solving a simple puzzle.
- Reward distinguishes cooperation, negotiation quality, and final outcome.
- There is a baseline vs trained comparison showing better strategic behavior.

## Theme 2: Super Long-Horizon Planning and Instruction Following

This theme is about deep multi-step reasoning with sparse or delayed rewards.

What the environment should teach:

- Decomposing long goals.
- Tracking state across extended trajectories.
- Recovering from earlier mistakes.
- Following many instructions over long sessions.
- Reasoning beyond shallow next-token response patterns.

Expected outcome:

- An environment that captures and improves LLM behavior on challenging long-horizon tasks, including tasks that may exceed context memory limits.

Example environment directions:

- OpenClaw-style multi-turn workflows.
- Research-planning simulators.
- Large-scale codebase refactoring tasks.
- Strategic resource management worlds.
- Long-horizon logistics optimization.
- Extremely complicated instruction following, such as hundreds of scattered instructions.

What would make this strong:

- The environment has real state that changes over time.
- The agent must preserve constraints and partial progress.
- Rewards are not only final pass/fail; they include meaningful intermediate signals when possible.
- The evaluation shows before/after improvement across long trajectories.

## Theme 3: World Modeling

World modeling is split into professional tasks and personalized tasks.

### Theme 3.1: Professional Tasks

This track asks teams to build environments requiring real interaction with tools, APIs, or dynamic systems. The model should do real work, not exploit shortcuts.

What the environment should teach:

- Maintaining consistent internal state.
- Updating beliefs based on tool/API outcomes.
- Orchestrating multi-step workflows.
- Causal reasoning.
- Persistent world models.

Expected outcome:

- An environment that captures the nuances of a partially observable world and improves LLM interaction with that world.

Example environment directions:

- Dynamic browser or API ecosystems.
- Enterprise applications.
- Scientific workflow loops, such as papers to code to experiments.
- Economic simulations with feedback.
- Tool-discovery benchmarks.
- Customer-service systems with realistic API failures and state transitions.

What would make this strong:

- Tools and APIs can fail realistically, with permissions, bad inputs, missing fields, or time zones.
- Verifiers check actual state transitions, not just the model's written claims.
- The task is difficult enough that a trained agent can show measurable improvement.

### Theme 3.2: Personalized Tasks

This track asks teams to build realistic personal-assistant task simulations.

What the environment should teach:

- Handling personal tasks.
- Managing conflicts.
- Delegating or prioritizing actions.
- Replying to difficult emails or messages.
- Resolving scheduling and life/work tradeoffs.

Expected outcome:

- An environment that realistically simulates personal task handling, conflicts, and delegation.

Example environment directions:

- Executive assistant meeting planner.
- Dinner and drive planning.
- Email and message replies.
- Shopping.
- Handling dinner conflicts due to work conflicts.
- Responding to tough emails with context and constraints.

What would make this strong:

- The environment includes personal constraints, preferences, calendar conflicts, and stakeholder tradeoffs.
- The reward captures correctness, tone, conflict resolution, and adherence to constraints.
- The agent cannot simply answer generically; it must use state and context.

## Theme 4: Self-Improvement

This theme focuses on environments where agents generate new challenges, escalate difficulty, and improve through self-play or adaptive curricula.

What the environment should teach:

- Self-play.
- Adaptive challenge generation.
- Recursive skill amplification.
- Moving beyond fixed tasks.
- Difficulty selection near the model's capability frontier.

Expected outcome:

- An environment for improving self-play of an LLM over a defined set of tasks.

Example environment directions:

- Self-play negotiation arenas.
- Auto-generated math or proof tasks.
- Evolving coding competitions.
- Adaptive RL curricula.
- Agents that create harder tasks for themselves as they improve.

What would make this strong:

- The task distribution adapts over time.
- The environment can prevent collapse into trivial or impossible tasks.
- The model improves against a clear baseline.
- The reward is not easily gamed by generating easy challenges.

## Theme 5: Wild Card - Impress Us

This theme exists for ideas that do not fit the four main boxes.

Rules of thumb:

- Be creative.
- The project must still meaningfully add value to LLM training on a task.
- It must still use OpenEnv and show a real training/evaluation story.
- It should not be a toy clone unless it has a fresh training insight.

Good wildcard ideas should still answer:

- What capability does this environment train?
- Why is this environment hard, novel, or underexplored?
- How can success be verified?
- How does the trained model improve?

## Problem statement rules

You do not have to choose the same problem statement as Round 1. Only keep the Round 1 idea if it aligns with the provided hackathon themes.

Before or during the onsite build:

- Finalize the problem statement.
- Build the environment.
- Define agent behavior.
- Design the reward model.
- Evaluate whether the work aligns with the judging criteria.
- Use onsite Hugging Face credits for post-training if needed.

Pick a task with all three properties:

1. The model can act step by step.
2. Success or progress can be verified programmatically.
3. The task is hard enough to be interesting, but not so hard that the model never receives positive reward.

Avoid tasks where the output only "looks good" to a human but cannot be verified objectively.

## Minimum submission requirements

These are non-negotiable. Missing any of these puts a team at a serious disadvantage.

Required:

- Use the latest release of OpenEnv.
- Build on top of OpenEnv rather than reinventing the framework.
- Provide a working training script using Unsloth or Hugging Face TRL.
- Ideally make the training script a Colab notebook so judges can re-run it.
- Show evidence of real training, at minimum loss and reward plots from a real run.
- Push the OpenEnv-compliant environment to Hugging Face Spaces.
- Provide a README that motivates the problem, explains the environment, and shows results.
- Include the Hugging Face Space link in the README.
- Include all additional materials in the README: video, blog, slides, presentation, W&B runs, or plots.
- Provide a short writeup, either a Hugging Face mini-blog, a YouTube video under 2 minutes, or a short slide deck.
- Do not include large video files in the Hugging Face environment repository; link to videos instead.

From the extra submission slide deck, the Google Form asks for:

- Hugging Face Space URL.
- Colab notebook link.
- Code repository link.
- YouTube video URL or Hugging Face blog post URL.
- All URLs and links must be included in the README. This is marked as a must.

Only one submission per team is allowed. If you have multiple ideas, pick the strongest one.

The judges will pull the environment from the submitted URL. Commits or changes after the deadline are not considered.

## Judging criteria

The official judging weights are:

| Criterion | Weight | What it means |
| --- | ---: | --- |
| Environment Innovation | 40% | Is the environment novel, creative, genuinely challenging, and meaningful for testing agent behavior? |
| Storytelling and Presentation | 30% | Can the team clearly explain the problem, environment, what the agent learned, and why it matters? Is the demo easy to follow for a non-technical audience? |
| Showing Improvement in Rewards | 20% | Is there observable evidence of training progress, such as reward curves, metrics, before/after behavior, or baseline comparison? |
| Reward and Training Pipeline | 10% | Is the reward logic coherent, and does the pipeline produce meaningful improvement in the trained agent's behavior? |

Important interpretation:

- Innovation is the largest category, but training evidence is still essential.
- The project must not be only an API wrapper or demo UI.
- Judges care about whether the environment can actually train an LLM to become better at something.
- Storytelling is nearly one-third of the score; a strong README and pitch matter.

## What makes a submission stand out

Pick an ambitious, original problem.

Judges have seen many chess, snake, tic-tac-toe, and grid-world clones. Those are unlikely to score well unless they contain a truly fresh environment or training insight.

Ask:

- Does this environment teach an LLM something it cannot currently do well?
- Is the domain underexplored in RL or LLM training?
- Could a researcher write a paper about training on this environment?

Design a reward signal that teaches.

A strong reward function:

- Provides informative signal, not only a final 0/1 if the task is long-horizon.
- Captures something hard to measure in a clever way.
- Uses OpenEnv's Rubric system thoughtfully.
- Uses composable rubrics instead of one monolithic scoring function.
- Is hard to game.
- Does not reward an agent that exploits loopholes without solving the real task.

Show real training end to end.

The bar is not "training script exists." The bar is:

- The training script connects to the environment.
- The agent trains against live environment feedback.
- The model learns something measurable.
- The team can show plots, numbers, or behavior changes.
- There is a trained agent vs random/untrained baseline comparison.

Make plots readable.

- Label axes.
- Use units when useful.
- Save plots as PNG or JPG and commit them to the repo.
- If using W&B, include the specific run link.
- Embed key plots in the README.
- Add a one-line caption explaining each plot.
- Put baseline vs trained runs on the same axis when possible.

Tell a story, not an API document.

The README, blog, and pitch should answer:

1. Problem: what capability gap or domain are you targeting?
2. Environment: what does the agent see, do, and get rewarded for?
3. Results: what changed after training?
4. Why it matters: who should care, and why?

A reviewer should be able to read the README in 3 to 5 minutes and want to try the environment.

Engineer cleanly.

- Use OpenEnv's `Environment` or `MCPEnvironment` base classes properly.
- Respect client/server separation.
- Clients should not import server internals.
- Follow the Gym-style API: `reset`, `step`, `state`.
- Include a valid `openenv.yaml` manifest.
- Do not use reserved tool names such as `reset`, `step`, `state`, or `close` for MCP tools.

## OpenEnv basics

OpenEnv standardizes RL environments so the same training code can work across many tasks.

A basic environment should define:

- `reset()`: start a fresh episode.
- `step(action)`: apply an action and return the next result.
- `state()` or observation: what the agent sees.
- Reward: what counts as progress or success.
- Episode termination: when the run ends.
- Safety constraints: timeouts, forbidden actions, and anti-cheat checks.

The intended workflow:

1. Bootstrap an environment skeleton using OpenEnv CLI.
2. Implement the action model.
3. Implement the observation model.
4. Implement state representation.
5. Implement `reset` and `step`.
6. Wrap it with a FastAPI app.
7. Run locally.
8. Push/deploy to Hugging Face Spaces.
9. Train through TRL/Unsloth.

Hugging Face Spaces provide:

- A running environment endpoint/server.
- A repository that can act as an installable Python package.
- A Docker/container registry image.

The main deck notes that environments can be:

- Accessed through the remote Space.
- Installed from the repository.
- Pulled and run as a Docker container.
- Run locally through Python/Uvicorn.

## RL loop for this hackathon

The minimum mental model:

1. Give the model a prompt or observation.
2. Let it generate an action, answer, strategy, code snippet, or plan.
3. Execute or evaluate that output in an environment or verifier.
4. Convert the result into reward.
5. Update the model so higher-reward behavior becomes more likely.

RL for LLMs differs from SFT:

- SFT says: copy this good target.
- RL says: try many outputs and move probability mass toward the ones that score better.

The best hackathon flow is usually:

1. Start from a capable instruct model.
2. Add light formatting or task scaffolding if needed.
3. Build a verifier and environment.
4. Use RL to improve behavior, not to create capability from scratch.

## SFT vs RL decision rule

Use this simple rule:

- If you have many high-quality demonstrations, use SFT.
- If you do not have demonstrations but can verify outputs, use RL.
- In many practical cases, do a little SFT or formatting priming first, then RL.

Why:

- SFT is usually more sample-efficient.
- RL is useful when success can be tested but ideal traces are expensive.
- RL often needs a warm start because the model must sometimes get non-zero reward.

## RLVR and RLVE

RLVR means reinforcement learning with verifiable rewards.

Instead of using only a learned reward model, RLVR uses:

- Unit tests.
- Exact answer checks.
- Regex or schema validation.
- Code execution.
- Environment task completion checks.
- Browser or API state checks.

RLVR is attractive when correctness is externally testable.

RLVE means reinforcement learning with verifiable environments.

The environment itself can:

- Generate tasks.
- Adjust difficulty.
- Provide verifiable rewards.
- Keep the model near its capability frontier.
- Avoid static datasets becoming too easy or too hard.

Difference:

- RLVR often works on a fixed or semi-fixed task set.
- RLVE makes the task source dynamic and adaptive.

For this hackathon, strong projects often look like small but real RLVE prototypes: an environment generates or serves tasks, the model acts, the verifier scores, and training improves behavior.

## PPO, GRPO, TRL, and Unsloth

PPO is a classic policy optimization algorithm that stabilizes updates by limiting how much the policy changes.

GRPO is a group-relative method commonly used in modern LLM RL work. The materials describe it as more efficient for some LLM setups because it can simplify away the value model used in PPO-style pipelines.

TRL is the training library:

- Provides post-training workflows such as SFT, DPO, PPO, GRPO, reward modeling, and related methods.
- Handles trainer setup, rollout integration, reward integration, optimization, and logging.

Unsloth is the efficiency layer:

- Speeds up fine-tuning and RL training.
- Reduces memory use.
- Helps when rollout generation/inference becomes the bottleneck.

Practical warning from the self-serve guide:

- If using QLoRA/LoRA, do not naively upcast a 4-bit model to 16-bit and then merge adapters.
- Use the correct merged-save path or use adapters directly.
- Test post-training inference immediately after saving.

## Reward engineering

Reward design is the task specification. RL optimizes what the reward says, not what you meant.

A good reward function often combines:

- Task success.
- Correctness.
- Format compliance.
- Timeout penalties.
- Resource usage.
- Safety constraints.
- Anti-cheating checks.
- Process or step-level checks when useful.

For a coding task, reward components might include:

- Syntax validity.
- Execution success.
- Unit test pass rate.
- Function contract compliance.
- Timeout and memory constraints.
- No forbidden global state.
- No edits to protected files.

Avoid using only one reward signal. Multiple independent checks reduce reward hacking.

Recommended pattern:

1. Start with a simple hard outcome check.
2. Add anti-cheat constraints.
3. Add shaping only where sparse reward is too weak.
4. Keep a stronger or separate holdout evaluator when possible.
5. Inspect model outputs, not only scalar reward.

## Reward hacking risks

Reward hacking occurs when the model maximizes reward without solving the intended task.

Examples:

- Editing timers.
- Caching results.
- Abusing globals.
- Mutating protected state.
- Exploiting weak regex checks.
- Passing shallow tests without solving the real problem.
- Fooling an LLM judge.
- Exploiting environment bugs.

Mitigation:

- Use multiple independent reward functions.
- Lock down execution.
- Add time limits.
- Avoid unrestricted global state.
- Validate actual state transitions.
- Use hard verifiers where possible.
- Sample outputs during training.
- Stop or roll back runs when behavior drifts.
- Try to break your own reward before training.

Important rule:

- Do not optimize a reward you have not tried to break yourself.

## Process supervision

Final outcome rewards can be inefficient, especially for long tasks. Process-aware feedback gives signal on intermediate steps.

Useful approximations:

- Step-level verifiers.
- Line-by-line checks.
- Program trace analysis.
- Tool-call success checks.
- LLM-as-judge for intermediate reasoning, used cautiously.

LLM judges can be gamed, so they should be one signal, not the only signal.

## Curriculum learning

RL stalls if the model never receives positive reward.

Use curriculum:

1. Easy tasks with short horizons.
2. Medium tasks with more branching.
3. Hard tasks only after non-zero reward appears.

Practical examples:

- Start with fewer tools.
- Use smaller state spaces.
- Add stronger hints early.
- Use simpler test cases.
- Gradually remove scaffolding.
- Increase task length after the model succeeds.

## Monitoring training

Do not monitor only average reward.

Track:

- Overall reward.
- Individual reward components.
- Success rate.
- Timeout rate.
- Format adherence.
- Rollout length.
- Verifier pass rate.
- Loss.
- Baseline vs trained comparison.
- Suspicious shortcuts.
- Sampled generations over time.

Rising reward is not enough if the model is exploiting the reward.

## Practical one-day execution plan

Phase 1: Pick a narrow task.

- Choose a small, verifiable environment.
- Avoid massive, subjective, or infrastructure-heavy ideas.

Phase 2: Build the environment.

- Use OpenEnv init.
- Implement `reset`, `step`, `state`, observations, and actions.
- Get a local loop working.

Phase 3: Build rewards.

- Add 2 to 4 independent reward checks.
- Add timeout and anti-cheat logic.
- Test the verifier manually.

Phase 4: Deploy.

- Push to Hugging Face Space or run via container/Uvicorn.
- Make sure teammates can use the same environment.

Phase 5: Train small.

- Run a tiny TRL plus Unsloth experiment.
- Inspect outputs, not just metrics.

Phase 6: Inspect for hacking.

- Sample generations.
- Check for state abuse, globals, shortcuts, or suspicious formatting.

Phase 7: Add curriculum.

- If reward is mostly zero, simplify tasks or add easier starts.

Phase 8: Train bigger.

- Increase rollout scale, batch size, or task diversity only after the loop is stable.

Phase 9: Save and demo.

- Save model/adapters correctly.
- Test inference.
- Show before/after behavior.

## Team split

A practical team split:

- Person A, Environment: build reset/step/state, local and remote execution, timeouts, and safety constraints.
- Person B, Verifier/Rewards: write reward functions, anti-cheat checks, and failure visibility.
- Person C, Training: set up TRL/Unsloth, run experiments, track metrics and generations.
- Person D, Demo/Product: prepare Hugging Face Space demo, README, plots, examples, blog/video, and final pitch.

For a team of 3, combine demo with environment or rewards. For solo, prioritize the smallest environment that can show a complete loop.

## Recommended demo structure

A simple compelling demo:

1. Explain the capability gap in one sentence.
2. Show the environment and what the agent observes.
3. Show a baseline or untrained model attempt.
4. Show verifier/reward output.
5. Show training curve or reward plot.
6. Show trained model attempt.
7. Explain what improved and what safeguards prevent reward hacking.

## README checklist

Your README should include:

- Project title and theme.
- Problem statement.
- Why the capability matters.
- Environment description.
- What the agent observes.
- What actions the agent can take.
- Episode termination conditions.
- Reward function and reward components.
- Anti-cheat and safety constraints.
- How to run locally.
- Hugging Face Space URL.
- Colab training notebook URL.
- Code repository URL.
- Training method: TRL, GRPO, Unsloth, model used.
- Baseline results.
- Trained results.
- Plots with captions.
- Demo video or Hugging Face blog link.
- Known limitations.
- Future improvements.

## Common mistakes to avoid

- Picking a task so hard that the model never gets reward.
- Picking a task too easy to show meaningful learning.
- Using only one reward function.
- Training before the environment is stable.
- Relying on static data instead of connecting training to the environment.
- Forgetting timeouts.
- Forgetting sandbox or anti-cheat limits.
- Trusting an LLM judge without hard checks.
- Monitoring only average reward.
- Not inspecting actual model outputs.
- Saving LoRA/QLoRA models incorrectly.
- Submitting links that are not in the README.
- Missing the Hugging Face Space URL.
- Including large videos in the environment repo instead of linking to them.
- Making a polished UI without a real training story.

## Resources and materials

Official OpenEnv resources:

- OpenEnv GitHub: https://github.com/meta-pytorch/OpenEnv
- OpenEnv docs: https://meta-pytorch.org/OpenEnv/
- Hugging Face OpenEnv org: https://huggingface.co/openenv
- Hugging Face OpenEnv Spaces: https://huggingface.co/openenv/spaces
- Tutorials: https://github.com/meta-pytorch/OpenEnv/tree/main/tutorial
- Training examples: https://github.com/meta-pytorch/OpenEnv/tree/main/tutorial/examples
- Environment examples: https://github.com/meta-pytorch/OpenEnv/tree/main/envs

Training examples from the main deck:

- OpenEnv tutorial examples: https://github.com/meta-pytorch/OpenEnv/tree/main/tutorial/examples
- Unsloth 2048 example: https://github.com/meta-pytorch/OpenEnv/blob/main/tutorial/examples/unsloth_2048.ipynb
- Wordle example: https://github.com/meta-pytorch/OpenEnv/blob/main/tutorial/examples/wordle.py
- TRL OpenEnv docs: https://huggingface.co/docs/trl/en/openenv
- TRL Sudoku GRPO example: https://github.com/huggingface/trl/blob/main/examples/notebooks/openenv_sudoku_grpo.ipynb
- TRL Wordle GRPO example: https://github.com/huggingface/trl/blob/main/examples/notebooks/openenv_wordle_grpo.ipynb
- More TRL OpenEnv examples: https://github.com/huggingface/trl/tree/main/examples/scripts/openenv

YouTube resources:

- https://www.youtube.com/watch?v=0airz7BhBiA
- https://www.youtube.com/watch?v=ap4q4sAK4OY
- https://www.youtube.com/watch?v=Jew4lhAiqnw
- https://www.youtube.com/live/kkCNMz0Ptd8?si=JJ7og8x5qc7_Gi0e
- Recommended chaptered lectures: https://openenv-india-apr-2026.lovable.app/

Lecture chapters from the self-serve guide:

- Module 1, Why OpenEnv: Workshop 8:02-15:05 or Mega Lecture 40:01-46:00.
- Module 2, Using Existing Environments: Workshop 35:33-43:05 or Mega Lecture 1:24:11-1:30:00.
- Module 3, Deploying Environments: Mega Lecture 1:30:00-1:39:07 or Workshop 43:05-48:30.
- Module 4, Building Your Own: Workshop 43:45-50:20 or Mega Lecture 1:33:30-1:39:07.
- Module 5, Training plus TRL: Mega Lecture 1:53:20-2:07:12 or Workshop 22:24-34:12.

Reward engineering papers:

- https://arxiv.org/abs/2408.10215
- https://arxiv.org/abs/2601.19100

## Final strategic advice

The best submission is not the one with the fanciest UI. It is the one that makes a convincing case that:

- The environment is novel and meaningful.
- The model can act inside it.
- The reward is coherent and hard to exploit.
- The training loop actually uses the environment.
- The model improves measurably.
- The story is clear enough for judges to understand quickly.

In one sentence: build an OpenEnv environment where success is verifiable, difficulty is controllable, reward loopholes are monitored, and training evidence proves that the LLM became better at acting.
