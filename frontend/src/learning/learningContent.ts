export interface CommandLesson {
  command: string;
  purpose: string;
  syntax: string;
  example: string;
  when: string;
  expected: string;
  mistakes: string;
}

export interface LearningModule {
  id: string;
  number: string;
  title: string;
  summary: string;
  explanation: string;
  terms: string[];
  example: string;
  mistakes: string[];
  practice: string;
  commands?: CommandLesson[];
  steps?: string[];
}

const command = (command: string, purpose: string, syntax: string, example: string, when: string, expected: string, mistakes: string): CommandLesson => ({ command, purpose, syntax, example, when, expected, mistakes });

export const learningModules: LearningModule[] = [
  {
    id: 'version-control', number: '01', title: 'Introduction to version control', summary: 'Learn why Git exists and how GitHub fits into the picture.',
    explanation: 'Version control records changes to files over time. It gives you a history you can inspect, lets you try work on a separate branch, and makes it easier for several people to contribute. Git is the version-control program that runs on your computer. GitHub is one online service for hosting Git repositories and collaborating around them.',
    terms: ['Version control: a record of changes over time.', 'Git: a distributed version-control system.', 'GitHub: a hosted collaboration service for Git repositories.', 'Local repository: the Git history on your computer.', 'Remote repository: a hosted copy that can exchange commits with your local copy.'],
    example: 'Git records commits on your computer. When you push, those commits are sent to a remote such as GitHub; the remote is not Git itself.',
    mistakes: ['Treating Git and GitHub as the same thing.', 'Assuming a GitHub repository automatically updates your local files.', 'Thinking a commit is a backup of every untracked file.'],
    practice: 'In your own words, explain which part of a Git workflow happens locally and which part happens on GitHub.',
  },
  {
    id: 'git-fundamentals', number: '02', title: 'Git fundamentals', summary: 'See how working files become a commit, and what branches and HEAD mean.',
    explanation: 'Git separates editing from recording. Your working directory contains the files you are editing. The staging area is a selection of changes prepared for the next commit. The repository stores committed snapshots and history. `git add` moves selected changes into the staging area; `git commit` records that staged snapshot in the current branch.',
    terms: ['Working directory: checked-out files you can edit.', 'Staging area / index: the exact changes prepared for a commit.', 'Repository: Git metadata and committed history.', 'Commit: a named snapshot with a message and parent history.', 'Branch: a movable name pointing to a line of commits.', 'HEAD: the commit or branch currently checked out.', '.git: the repository metadata directory created by Git.'],
    example: 'Edit app.ts → `git status` shows it as modified → `git add app.ts` stages it → `git diff --cached` reviews what will be recorded → `git commit -m "Explain upload limits"` records it.',
    mistakes: ['Committing before checking which changes are staged.', 'Assuming `git add` uploads files to GitHub; it only stages them locally.', 'Editing while on an unexpected branch.'],
    practice: 'Make a small edit in a practice repository. Observe the file before and after `git add` using `git status`.',
  },
  {
    id: 'essential-commands', number: '03', title: 'Essential Git commands', summary: 'A practical reference for the commands you will use most often.',
    explanation: 'Run commands from inside the repository unless you are initializing or cloning one. Read the output before continuing, especially before commit, merge, stash, or push operations.',
    terms: ['Working tree: the current state of tracked and untracked files.', 'Remote: a named URL for another repository.', 'Upstream: commonly the original project remote when your fork is `origin`.'],
    example: 'A safe everyday loop is `git status`, inspect with `git diff`, stage specific files with `git add <file>`, review the staged diff, then commit.',
    mistakes: ['Copying commands without checking the current directory or branch.', 'Using broad staging when you have unrelated changes.', 'Assuming `git pull` only downloads without changing the current branch.'],
    practice: 'Choose three commands from the reference and write down what output you expect before running them in a practice repository.',
    commands: [
      command('git --version','Prints the installed Git version.','git --version','git --version','Check whether Git is installed and identify its version.','A version string such as `git version 2.x`.','Confusing this with a repository command; it works from any directory.'),
      command('git config','Reads or changes Git configuration.','git config [--global] <key> <value>','git config --global user.name "A Developer"','Set commit identity or inspect a setting.','The setting is saved at the chosen scope.','Using `--global` for a setting intended only for one project, or mistyping an email.'),
      command('git init','Creates a new repository in the current directory.','git init [directory]','git init practice-project','Start version control for a new local project.','Git creates a `.git` directory and reports the initialized path.','Running it inside an existing project with nested repositories unintentionally.'),
      command('git clone','Copies a remote repository and its history locally.','git clone <url> [directory]','git clone https://github.com/example/project.git','Start work from a hosted repository.','A new local directory contains the checked-out files and Git history.','Cloning a fork when you intended the original, or assuming clone grants write access.'),
      command('git status','Summarizes the branch and file states.','git status [--short]','git status','Before and after edits, staging, commits, and branch operations.','The current branch, staged changes, unstaged changes, and untracked files.','Ignoring untracked files or reading “nothing to commit” as a problem.'),
      command('git add','Stages selected file changes for the next commit.','git add <file>','git add src/parser.ts','After reviewing a change you intend to include.','The path appears under “Changes to be committed”.','Thinking it commits or pushes the file; it only stages it. Check the staged diff.'),
      command('git commit','Records staged changes as a new commit.','git commit -m "message"','git commit -m "Handle empty usernames"','After reviewing the staged files and diff.','A commit identifier and summary are printed.','Writing a vague message or committing unrelated staged changes.'),
      command('git log','Shows commit history.','git log [--oneline]','git log --oneline -5','Understand recent history or locate a commit.','A list of commits, newest first.','Assuming the visible branch contains every remote branch.'),
      command('git diff','Shows changes not yet staged; `--cached` shows staged changes.','git diff [--cached]','git diff -- src/parser.ts','Review exactly what changed before staging or committing.','A line-by-line patch, or no output when there are no changes in that comparison.','Using only `git diff` after staging; use `git diff --cached` to review staged content.'),
      command('git branch','Lists or manages local branches.','git branch [name]','git branch','Inspect available local branches.','The current branch has an asterisk; create/delete options alter local refs.','Deleting a branch before confirming its work is merged or saved.'),
      command('git switch','Changes branches or creates a branch with `-c`.','git switch <branch>','git switch -c fix/empty-input','Move to a branch or create a focused work branch.','HEAD and the checked-out files move to that branch.','Switching with uncommitted changes that conflict, or working on the wrong branch.'),
      command('git checkout','Older multi-purpose command for branches and paths.','git checkout <branch>','git checkout main','Legacy projects may use it to switch branches.','Checks out the branch or path requested.','Its branch and file-restoration forms can be confusing; prefer `git switch` for branches and `git restore` for file changes.'),
      command('git merge','Combines another branch into the current branch.','git merge <branch>','git merge main','Bring reviewed changes from another branch into the one currently checked out.','A merge commit or fast-forward; conflicts may require resolution.','Merging into the wrong current branch; check `git status` and branch first.'),
      command('git remote','Lists or manages named repository URLs.','git remote -v','git remote -v','Check where fetch and push operations will go.','Names such as `origin` with fetch/push URLs.','Assuming `origin` always means the upstream project; in a fork workflow it usually means your fork.'),
      command('git push','Sends local commits to a remote branch.','git push <remote> <branch>','git push origin fix/empty-input','Publish a branch so collaborators or a pull request can see it.','The remote branch updates if the push is accepted.','Pushing to the wrong remote/branch or treating a rejected push as permission to force push.'),
      command('git pull','Fetches remote changes then integrates them into the current branch.','git pull [remote] [branch]','git pull origin main','Update a branch from its remote tracking branch.','New commits are fetched and merged or rebased according to configuration.','Using it without knowing which branch is current; inspect status and pull target first.'),
      command('git fetch','Downloads remote refs and commits without integrating them into your current branch.','git fetch <remote>','git fetch upstream','Inspect remote updates before deciding how to integrate them.','Remote-tracking refs update; your checked-out files do not change.','Expecting local branch files to change. Compare with `git log HEAD..upstream/main` or `git diff`.'),
      command('git stash','Temporarily saves tracked working changes for later restoration.','git stash push -m "message"','git stash push -m "pause parser work"','Set aside work briefly when a branch switch requires a clean working tree.','Changes are saved in a stash entry; inspect with `git stash list`.','Treating stash as durable backup, forgetting untracked files need `-u`, or dropping a stash before checking it.'),
    ],
  },
  {
    id: 'github-collaboration', number: '04', title: 'GitHub and collaboration', summary: 'Understand repositories, forks, remotes, issues, reviews and pull requests.',
    explanation: 'A repository hosts files and Git history. A fork is your GitHub-hosted copy of another repository. Clone a repository or fork to work locally. In the common fork setup, `origin` points to your fork and `upstream` points to the original project. A pull request proposes changes from your branch so maintainers can discuss and review them.',
    terms: ['Fork: a server-side copy under your account or organization.', 'Origin: the default remote name created by clone; often your fork.', 'Upstream: a conventional name for the original project remote.', 'Issue: a discussion about a bug, question, or proposed work.', 'Pull request: a proposal to merge changes with review and discussion.', 'Discussion: a broader community conversation where enabled.'],
    example: 'Fork `owner/project` → clone your fork → add the original as `upstream` → push a branch to `origin` → open a pull request targeting the original project.',
    mistakes: ['Opening a pull request from the wrong base branch.', 'Treating an issue as approval to implement a change without reading contribution guidance.', 'Pushing a branch to the original repository without permission.'],
    practice: 'On a public repository, locate its Issues, Pull requests, README and contribution guide. Do not make changes; identify the project’s expected workflow.',
  },
  {
    id: 'branches-conflicts', number: '05', title: 'Branches and merge conflicts', summary: 'Work in focused branches and resolve overlapping edits safely.',
    explanation: 'A branch lets you develop a change without moving the main line of work. A merge conflict occurs when Git cannot automatically combine overlapping edits. The conflict markers show the competing versions; they are instructions for you to choose or combine content, not part of the final source.',
    terms: ['Conflict: edits Git cannot combine automatically.', 'Conflict markers: `<<<<<<<`, `=======`, and `>>>>>>>` delimit competing text.', 'Base: the common ancestor Git uses to compare branch changes.'],
    example: 'Keep the intended code, remove all three conflict markers, then run `git diff --check`, inspect `git diff`, and run relevant tests before committing the resolution.',
    mistakes: ['Deleting one side without understanding its purpose.', 'Leaving conflict markers in source files.', 'Marking a file resolved before validating the final result.'],
    practice: 'In a disposable practice repository, change the same line on two branches and merge them to observe the markers.',
    steps: ['Confirm which branch you are on with `git status`.', 'Read each conflict block and inspect surrounding code.', 'Combine the intended behavior and remove every marker.', 'Review the complete diff and run the affected tests.', 'Stage only resolved files and complete the merge when the result is correct.'],
  },
  {
    id: 'first-contribution', number: '06', title: 'Make your first open-source contribution', summary: 'Follow a small, reviewable path from finding a project to responding to review.',
    explanation: 'A good first contribution is small enough to understand and test. Read the project’s own guidance, confirm that an issue is available to work on, and ask questions when requirements are unclear. FirstPatch AI can explain only the files you upload; verify suggestions in the full project before changing code.',
    terms: ['Contribution guide: project-specific rules for proposed changes.', 'Focused change: a small change with one clear purpose.', 'Review feedback: questions or requested adjustments from maintainers.'],
    example: 'Before coding, write down the reported behavior, the files you expect to inspect, and one test that would demonstrate the desired behavior.',
    mistakes: ['Taking on a large issue before understanding its scope.', 'Skipping tests or project-specific formatting instructions.', 'Treating AI guidance as verified repository knowledge.'],
    practice: 'Choose a repository with a contribution guide. Summarize its branch naming, test, and pull request instructions before selecting an issue.',
    steps: ['Find a repository you can build or understand at a small scale.', 'Read its README, license, code of conduct, and contribution guidelines.', 'Find an issue that is open, appropriately scoped, and not already assigned.', 'Fork the repository and clone your fork.', 'Add the original project as the `upstream` remote.', 'Create a focused feature branch.', 'Trace the relevant code and understand its existing tests.', 'Make one small change that addresses the agreed scope.', 'Run the project’s relevant checks and review the full diff.', 'Commit with a clear message and push your branch to your fork.', 'Open a pull request using the project’s requested template and explain the change.', 'Respond constructively to review feedback and update the branch as needed.'],
  },
];

export interface LearningFaq {
  question: string;
  answer: string;
  category: 'Git basics' | 'GitHub workflow' | 'First contributions' | 'FirstPatch AI';
  moduleId?: string;
}

export const learningFaqs: LearningFaq[] = [
  { question: 'Do I need to know Git before using FirstPatch AI?', answer: 'No. You can upload selected source files without writing an issue description. The Learn section is optional and does not gate the analyzer.', category: 'FirstPatch AI' },
  { question: 'What is the difference between Git and GitHub?', answer: 'Git is version-control software that records repository history. GitHub is a website and service that hosts Git repositories and collaboration features.', category: 'Git basics', moduleId: 'version-control' },
  { question: 'What is a repository?', answer: 'A repository is a project’s files together with Git’s history and metadata. A local repository is on your device; a remote repository is hosted elsewhere.', category: 'Git basics', moduleId: 'git-fundamentals' },
  { question: 'What is a fork?', answer: 'A fork is a server-side copy of a repository, usually under your GitHub account, where you can push branches without write access to the original.', category: 'GitHub workflow', moduleId: 'github-collaboration' },
  { question: 'What is a branch?', answer: 'A branch is a named pointer to a line of commits. It lets you work on a change separately from another branch such as `main`.', category: 'Git basics', moduleId: 'git-fundamentals' },
  { question: 'What is a commit?', answer: 'A commit is a recorded snapshot of the changes you staged, with a message and a link to earlier history.', category: 'Git basics', moduleId: 'git-fundamentals' },
  { question: 'What is a pull request?', answer: 'A pull request proposes that a branch’s changes be reviewed and merged into another branch. It gives contributors and maintainers a place to discuss the change.', category: 'GitHub workflow', moduleId: 'github-collaboration' },
  { question: 'What is an issue?', answer: 'An issue is a project discussion used to report a bug, ask a question, or propose work. Read the project’s guidance before starting.', category: 'GitHub workflow', moduleId: 'github-collaboration' },
  { question: 'What does `git push` do?', answer: 'It sends local commits to a named remote branch. It does not submit a pull request by itself.', category: 'GitHub workflow', moduleId: 'essential-commands' },
  { question: 'What is the difference between `git fetch` and `git pull`?', answer: '`git fetch` downloads remote history without changing the current branch. `git pull` fetches and then integrates changes into the current branch, typically by merge or rebase.', category: 'Git basics', moduleId: 'essential-commands' },
  { question: 'What is a merge conflict?', answer: 'A merge conflict means Git could not safely combine overlapping changes automatically. Review both sides, resolve the intended behavior, remove markers, and test.', category: 'Git basics', moduleId: 'branches-conflicts' },
  { question: 'How do I resolve a merge conflict?', answer: 'Check the current branch and conflicted files, inspect the surrounding code and both versions, edit the final content, remove conflict markers, review the diff, and run relevant tests before staging the resolution.', category: 'Git basics', moduleId: 'branches-conflicts' },
  { question: 'Can beginners contribute to open-source projects?', answer: 'Yes. Start with a project whose setup and contribution guidance you can follow, choose a small issue, and ask maintainers when scope is unclear.', category: 'First contributions', moduleId: 'first-contribution' },
  { question: 'How do I find beginner-friendly issues?', answer: 'Read project contribution guidance, look for issues that are open and clearly scoped, check whether someone is already assigned, and ask maintainers if the expected change is uncertain.', category: 'First contributions', moduleId: 'first-contribution' },
  { question: 'What should I do before opening a pull request?', answer: 'Run the relevant project checks, inspect your complete diff, confirm your branch is pushed to the right fork, and follow the project’s pull request template and contribution rules.', category: 'First contributions', moduleId: 'first-contribution' },
  { question: 'Does FirstPatch AI execute uploaded code?', answer: 'No. The backend validates and reads supported text files in memory; the uploaded source is not executed.', category: 'FirstPatch AI' },
  { question: 'Are FirstPatch AI’s suggested bugs guaranteed to be real?', answer: 'No. Results distinguish observed behavior from inferred risks where the model provides that classification. Treat suggestions as investigation guidance and verify them against the repository.', category: 'FirstPatch AI' },
  { question: 'Does FirstPatch AI understand an entire repository from a partial file upload?', answer: 'No. It analyzes only the selected files you upload. Missing files and surrounding system behavior can limit the analysis and should be checked in the repository.', category: 'FirstPatch AI' },
  { question: 'Are suggested tests executed by FirstPatch AI?', answer: 'No. The app suggests tests for you to consider; it does not run the uploaded project’s tests.', category: 'FirstPatch AI' },
  { question: 'Is my learning progress synchronized across devices?', answer: 'No. Roadmap progress is stored in localStorage in this browser. It does not synchronize across devices or accounts.', category: 'FirstPatch AI' },
];

export interface TroubleshootingEntry {
  error: string;
  means: string;
  why: string;
  diagnose: string;
  safeFix: string;
  prevent: string;
}

export const troubleshootingEntries: TroubleshootingEntry[] = [
  { error: 'fatal: not a git repository', means: 'Git cannot find a repository from the current directory.', why: 'You may be in the wrong folder, or the project has not been cloned or initialized.', diagnose: 'Run `pwd` (or check the current folder in your terminal) and `git status`.', safeFix: 'Change to the project directory. Initialize a new repository only if this is a new project; otherwise clone the correct remote.', prevent: 'Open a terminal at the project root and confirm the path before running Git commands.' },
  { error: 'nothing to commit', means: 'Git has no staged changes to record.', why: 'The working tree may be unchanged, or edits have not been staged.', diagnose: 'Run `git status` and inspect `git diff`.', safeFix: 'If the changes are intended, stage the specific paths with `git add <file>`; otherwise there is nothing to commit.', prevent: 'Check status and the staged diff before committing.' },
  { error: 'remote origin already exists', means: 'A remote named `origin` is already configured.', why: 'The repository was cloned with a remote or one was added earlier.', diagnose: 'Run `git remote -v` to inspect its URLs.', safeFix: 'Use the existing remote if it is correct. If needed, add another remote under a different name; change a URL only after confirming the destination.', prevent: 'Inspect configured remotes before adding one.' },
  { error: 'rejected: non-fast-forward', means: 'The remote branch has commits missing locally, so Git refused to overwrite its history.', why: 'Someone pushed first, or local and remote branches diverged.', diagnose: 'Run `git status`, then fetch and inspect the remote commits and differences.', safeFix: 'Integrate the remote changes using the project’s preferred merge or rebase workflow, resolve and test, then push again. Do not force push as a routine fix.', prevent: 'Fetch and review remote changes before pushing shared branches.' },
  { error: 'Merge conflict', means: 'Git could not combine overlapping edits automatically.', why: 'Two changes affect the same lines or nearby structure.', diagnose: 'Run `git status` to list conflicted paths; inspect the `<<<<<<<`, `=======`, `>>>>>>>` sections.', safeFix: 'Combine the intended behavior, remove markers, review the final diff, and run relevant tests before staging.', prevent: 'Keep branches focused and integrate changes regularly; communicate before editing shared areas.' },
  { error: 'Authentication failed', means: 'The host did not accept the credentials or authentication method.', why: 'Credentials may be expired, missing, or not permitted for the repository.', diagnose: 'Confirm the remote URL with `git remote -v` and use your Git host’s current authentication guidance.', safeFix: 'Use the host’s supported credential manager or SSH setup; never paste tokens into source files or commit them.', prevent: 'Keep credentials in approved credential storage and use least-privilege access.' },
  { error: 'Permission denied', means: 'Your account or SSH key does not have the requested access.', why: 'The remote may be the original repository, or the account lacks write permission.', diagnose: 'Check the remote URL, signed-in account, and repository permissions.', safeFix: 'For contributions, push to your fork and open a pull request to the original project. Ask an owner for access when direct write access is expected.', prevent: 'Confirm the remote and access model before pushing.' },
];
