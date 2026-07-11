// ============================================================
// OpenStoryflow — built-in Tactics (blueprints) & Templates
// A Tactic = a set of "smart" cards; each card carries a
// `purpose` string that drives its card-level AI assistant.
// ============================================================

const TACTICS = [
  // ---------------- FILMMAKING ----------------
  {
    id: 'heros-journey', name: "Hero's Journey", category: 'Filmmaking',
    desc: "Campbell's 12-stage monomyth for structuring any story.",
    cards: [
      { title: 'Ordinary World', purpose: "Describe the hero's normal life before the adventure — status quo, flaws, longing." },
      { title: 'Call to Adventure', purpose: 'Define the inciting incident that disrupts the ordinary world.' },
      { title: 'Refusal of the Call', purpose: 'Show the hero\'s fear or reluctance — what holds them back?' },
      { title: 'Meeting the Mentor', purpose: 'Introduce the mentor figure and what wisdom/tools they give the hero.' },
      { title: 'Crossing the Threshold', purpose: 'The point of no return — the hero commits and enters the special world.' },
      { title: 'Tests, Allies, Enemies', purpose: 'List the trials, friends and foes the hero meets in the special world.' },
      { title: 'The Ordeal', purpose: 'The central crisis — the hero faces death (literal or symbolic).' },
      { title: 'The Reward', purpose: 'What the hero seizes after surviving the ordeal.' },
      { title: 'The Road Back', purpose: 'The chase or consequence that pushes the hero back toward the ordinary world.' },
      { title: 'Resurrection', purpose: 'The final test where the hero proves transformation.' },
      { title: 'Return with the Elixir', purpose: 'How the hero returns changed, and what boon they bring home.' }
    ]
  },
  {
    id: 'save-the-cat', name: 'Save the Cat Beat Sheet', category: 'Filmmaking',
    desc: "Blake Snyder's 15-beat screenplay structure.",
    cards: [
      { title: 'Opening Image', purpose: 'A single visual that sets tone and shows the "before" state.' },
      { title: 'Theme Stated', purpose: 'Where and how the theme is voiced (often to the protagonist).' },
      { title: 'Set-Up', purpose: 'Introduce hero, stakes, and everything that needs fixing.' },
      { title: 'Catalyst', purpose: 'The life-changing event that kicks off the story.' },
      { title: 'Debate', purpose: 'The hero doubts — should I go? Can I do this?' },
      { title: 'Break into Two', purpose: 'The hero makes a choice and the adventure truly begins.' },
      { title: 'B Story', purpose: 'The secondary (often love/friendship) story carrying the theme.' },
      { title: 'Fun and Games', purpose: 'The "promise of the premise" — the trailer moments.' },
      { title: 'Midpoint', purpose: 'False victory or false defeat; stakes are raised.' },
      { title: 'Bad Guys Close In', purpose: 'External and internal pressure mounts.' },
      { title: 'All Is Lost', purpose: 'The lowest point — whiff of death.' },
      { title: 'Dark Night of the Soul', purpose: 'The hero processes the loss and finds the missing insight.' },
      { title: 'Break into Three', purpose: 'The solution appears thanks to theme + B story.' },
      { title: 'Finale', purpose: 'The hero executes the plan and proves the change.' },
      { title: 'Final Image', purpose: 'Mirror of the opening image showing how much changed.' }
    ]
  },
  {
    id: 'five-act', name: 'Five-Act Structure', category: 'Filmmaking',
    desc: 'Classic dramatic arc (Freytag) for plays, films and novels.',
    cards: [
      { title: 'Act I — Exposition', purpose: 'Introduce world, characters, and the dramatic question.' },
      { title: 'Act II — Rising Action', purpose: 'Complications escalate; obstacles multiply.' },
      { title: 'Act III — Climax', purpose: 'The turning point of maximum tension.' },
      { title: 'Act IV — Falling Action', purpose: 'Consequences unfold; the end approaches.' },
      { title: 'Act V — Resolution', purpose: 'The new equilibrium and final emotional note.' }
    ]
  },
  {
    id: 'documentary-outline', name: 'Documentary Outline', category: 'Filmmaking',
    desc: 'Plan a documentary from premise to distribution.',
    cards: [
      { title: 'Core Premise', purpose: 'One sentence: what is this documentary about and why now?' },
      { title: 'Central Question', purpose: 'The driving question the film tries to answer.' },
      { title: 'Key Subjects', purpose: 'Who appears on camera and what does each represent?' },
      { title: 'Narrative Arc', purpose: 'How the story evolves from opening to resolution.' },
      { title: 'Visual Style', purpose: 'Look, palette, camera language, archival vs. verité.' },
      { title: 'Interview Questions', purpose: 'Master list of questions for the subjects.' },
      { title: 'B-Roll Wishlist', purpose: 'Supporting footage needed to cover the story.' },
      { title: 'Access & Permissions', purpose: 'Locations, subjects and archives that require clearance.' },
      { title: 'Budget Snapshot', purpose: 'Rough cost areas: crew, travel, gear, post, music.' },
      { title: 'Distribution Strategy', purpose: 'Festivals, streamers, YouTube — where will it live?' }
    ]
  },
  {
    id: 'shot-list', name: 'Shot List Builder', category: 'Filmmaking',
    desc: 'Break a scene into concrete shots.',
    cards: [
      { title: 'Scene Summary', purpose: 'What happens in the scene and its emotional purpose.' },
      { title: 'Master Shot', purpose: 'The wide covering the whole scene geography.' },
      { title: 'Coverage', purpose: 'Mediums, close-ups, OTS — list each setup with lens ideas.' },
      { title: 'Inserts & Details', purpose: 'Cutaways and detail shots that sell the moment.' },
      { title: 'Camera Movement', purpose: 'Dolly, handheld, static — motivation for each move.' },
      { title: 'Lighting Notes', purpose: 'Mood, sources, contrast ratio, practicals.' },
      { title: 'Sound Notes', purpose: 'Production sound needs, wild lines, room tone.' }
    ]
  },
  {
    id: 'character-development', name: 'Character Development', category: 'Filmmaking',
    desc: 'Deep-dive one character from want to wound.',
    cards: [
      { title: 'External Want', purpose: 'What the character consciously pursues.' },
      { title: 'Internal Need', purpose: 'What they actually need to learn or become.' },
      { title: 'The Wound', purpose: 'Past event that shaped their false belief.' },
      { title: 'The Lie They Believe', purpose: 'The false worldview driving bad choices.' },
      { title: 'Strengths & Flaws', purpose: 'Traits that help and traits that sabotage.' },
      { title: 'Voice & Mannerisms', purpose: 'How they speak, move, dress; distinctive habits.' },
      { title: 'Relationships Map', purpose: 'How they relate to every other major character.' },
      { title: 'Arc Milestones', purpose: 'Concrete moments where the character visibly changes.' }
    ]
  },
  {
    id: 'pixar-spine', name: 'Pixar Story Spine', category: 'Filmmaking',
    desc: 'The famous 8-sentence story skeleton.',
    cards: [
      { title: 'Once upon a time…', purpose: 'Establish the world and protagonist.' },
      { title: 'Every day…', purpose: 'The routine — the pattern of normal life.' },
      { title: 'One day…', purpose: 'The event that breaks the routine.' },
      { title: 'Because of that…', purpose: 'First consequence.' },
      { title: 'Because of that… (2)', purpose: 'Escalating consequence.' },
      { title: 'Because of that… (3)', purpose: 'Further escalation toward crisis.' },
      { title: 'Until finally…', purpose: 'The climax that resolves the chain.' },
      { title: 'And ever since then…', purpose: 'The new normal and its meaning.' }
    ]
  },
  {
    id: 'preproduction-plan', name: 'Pre-production Plan', category: 'Filmmaking',
    desc: 'Everything to lock before the first shooting day.',
    cards: [
      { title: 'Logline', purpose: 'One-sentence pitch of the project.' },
      { title: 'Script Status', purpose: 'Draft stage, locked pages, remaining rewrites.' },
      { title: 'Casting', purpose: 'Roles, candidates, audition plan.' },
      { title: 'Locations', purpose: 'Needed locations, scouting status, permits.' },
      { title: 'Crew', purpose: 'Key departments and who fills them.' },
      { title: 'Schedule', purpose: 'Shooting days, order, contingencies.' },
      { title: 'Budget', purpose: 'Top-sheet categories and current estimates.' },
      { title: 'Gear List', purpose: 'Camera, lenses, grip, sound packages.' },
      { title: 'Risk & Backup Plans', purpose: 'Weather, availability, plan B for each risk.' }
    ]
  },

  // ---------------- CONTENT CREATION ----------------
  {
    id: 'youtube-strategy', name: 'YouTube Channel Strategy', category: 'Content Creation',
    desc: 'Position, program and grow a channel.',
    cards: [
      { title: 'Channel Promise', purpose: 'What viewers reliably get from every video.' },
      { title: 'Target Viewer', purpose: 'Who exactly watches — age, interests, moment of watching.' },
      { title: 'Content Pillars', purpose: '3–5 recurring formats/themes the channel rotates.' },
      { title: 'Title & Thumbnail System', purpose: 'Patterns for clickable packaging without clickbait rot.' },
      { title: 'Upload Cadence', purpose: 'Sustainable frequency and production pipeline.' },
      { title: 'Retention Tactics', purpose: 'Hooks, pacing, open loops, pattern interrupts.' },
      { title: 'Growth Loops', purpose: 'Shorts funnels, collabs, SEO, community posts.' },
      { title: 'Monetisation Later', purpose: 'Sponsors, products, memberships — sketched, not built yet.' }
    ]
  },
  {
    id: 'video-script', name: 'Video Script Framework', category: 'Content Creation',
    desc: 'Hook → deliver → payoff structure for a single video.',
    cards: [
      { title: 'Hook (0–15s)', purpose: 'The opening line/visual that earns the next 30 seconds.' },
      { title: 'Setup', purpose: 'Context the viewer needs — as little as possible.' },
      { title: 'Value Blocks', purpose: 'The 3–5 core segments delivering the promise.' },
      { title: 'Pattern Interrupts', purpose: 'Where to change energy, visuals or location.' },
      { title: 'Payoff', purpose: 'The satisfying conclusion that resolves the hook.' },
      { title: 'CTA', purpose: 'One single ask — what should the viewer do next?' }
    ]
  },
  {
    id: 'content-calendar', name: 'Content Calendar', category: 'Content Creation',
    desc: 'Plan a month of multi-platform content.',
    cards: [
      { title: 'Monthly Theme', purpose: 'The umbrella topic for this cycle.' },
      { title: 'Week 1', purpose: 'Pieces, platforms and publish dates for week one.' },
      { title: 'Week 2', purpose: 'Pieces, platforms and publish dates for week two.' },
      { title: 'Week 3', purpose: 'Pieces, platforms and publish dates for week three.' },
      { title: 'Week 4', purpose: 'Pieces, platforms and publish dates for week four.' },
      { title: 'Repurposing Map', purpose: 'How each hero piece becomes clips, posts, emails.' },
      { title: 'Metrics to Watch', purpose: 'Which numbers define success this month.' }
    ]
  },
  {
    id: 'blog-post', name: 'Blog Post Framework', category: 'Content Creation',
    desc: 'From working title to publish-ready outline.',
    cards: [
      { title: 'Working Title', purpose: '5–10 title variants; pick for clarity + curiosity.' },
      { title: 'Reader & Search Intent', purpose: 'Who searches for this and what they want to leave with.' },
      { title: 'Core Argument', purpose: 'The one idea the post defends.' },
      { title: 'Outline', purpose: 'H2/H3 skeleton with one-line summaries.' },
      { title: 'Evidence & Examples', purpose: 'Data, stories, screenshots that prove each section.' },
      { title: 'Intro Draft', purpose: 'Hook, stakes, promise — first 100 words.' },
      { title: 'CTA & Internal Links', purpose: 'Where the reader goes next.' }
    ]
  },
  {
    id: 'tiktok-planner', name: 'Short-form Video Planner', category: 'Content Creation',
    desc: 'Batch-plan TikTok/Reels/Shorts.',
    cards: [
      { title: 'Niche Angle', purpose: 'The specific corner of the niche you own.' },
      { title: 'Hook Bank', purpose: '10+ reusable opening lines/visual hooks.' },
      { title: 'Format Templates', purpose: 'Repeatable video formats (listicle, POV, before/after…).' },
      { title: 'Batch Plan', purpose: 'Which videos to film in the next batch session.' },
      { title: 'Trend Watch', purpose: 'Sounds/formats trending now worth adapting.' },
      { title: 'Comments → Content', purpose: 'Questions from comments to turn into videos.' }
    ]
  },
  {
    id: 'podcast-episode', name: 'Podcast Episode Plan', category: 'Content Creation',
    desc: 'Structure an interview or solo episode.',
    cards: [
      { title: 'Episode Promise', purpose: 'What the listener learns/feels by the end.' },
      { title: 'Guest Research', purpose: 'Bio, past interviews, unexplored angles.' },
      { title: 'Question Arc', purpose: 'Questions ordered as a narrative, easy → deep.' },
      { title: 'Cold Open Candidates', purpose: 'Moments likely to make a great cold open.' },
      { title: 'Segments & Timing', purpose: 'Episode blocks with rough durations.' },
      { title: 'Clips Plan', purpose: 'Which moments become promo clips.' }
    ]
  },
  {
    id: 'newsletter-engine', name: 'Newsletter Engine', category: 'Content Creation',
    desc: 'Design a newsletter people actually open.',
    cards: [
      { title: 'Positioning', purpose: 'Why subscribe to this and not the other hundred.' },
      { title: 'Recurring Sections', purpose: 'The fixed skeleton every issue follows.' },
      { title: 'Subject Line System', purpose: 'Patterns and rules for subject lines.' },
      { title: 'Growth Channels', purpose: 'Where new subscribers come from.' },
      { title: 'Welcome Sequence', purpose: 'First 3 emails a new subscriber receives.' }
    ]
  },

  // ---------------- BUSINESS ----------------
  {
    id: 'aida', name: 'AIDA Funnel', category: 'Business',
    desc: 'Attention → Interest → Desire → Action copywriting frame.',
    cards: [
      { title: 'Attention', purpose: 'The hook that stops the scroll — headline, visual, first line.' },
      { title: 'Interest', purpose: 'Facts, story or tension that keeps them reading.' },
      { title: 'Desire', purpose: 'Benefits, proof and identity — make them want it.' },
      { title: 'Action', purpose: 'The single clear ask and friction removal.' }
    ]
  },
  {
    id: 'storybrand', name: 'StoryBrand BrandScript', category: 'Business',
    desc: "Don Miller's 7-part framework: the customer is the hero.",
    cards: [
      { title: 'A Character (Hero)', purpose: 'Your customer — what do they want related to your offer?' },
      { title: 'Has a Problem', purpose: 'External, internal and philosophical problem layers.' },
      { title: 'Meets a Guide', purpose: 'Your brand: empathy + authority signals.' },
      { title: 'Who Gives Them a Plan', purpose: 'The simple 3-step plan to buy/succeed.' },
      { title: 'Calls Them to Action', purpose: 'Direct CTA and transitional CTA.' },
      { title: 'That Avoids Failure', purpose: 'What\'s at stake if they don\'t act.' },
      { title: 'And Ends in Success', purpose: 'The transformation — before vs after identity.' }
    ]
  },
  {
    id: 'marketing-campaign', name: 'Marketing Campaign Plan', category: 'Business',
    desc: 'End-to-end campaign from goal to measurement.',
    cards: [
      { title: 'Campaign Goal', purpose: 'One measurable objective with a deadline.' },
      { title: 'Target Audience', purpose: 'Segment, pains, watering holes, buying triggers.' },
      { title: 'Core Message', purpose: 'The one thing the audience must remember.' },
      { title: 'Offer', purpose: 'What exactly is promoted and its incentive.' },
      { title: 'Channels', purpose: 'Where the campaign runs and why each channel.' },
      { title: 'Creative Assets', purpose: 'Every asset to produce: ads, pages, emails, videos.' },
      { title: 'Timeline', purpose: 'Phases: teaser, launch, sustain, close.' },
      { title: 'Budget', purpose: 'Spend allocation per channel.' },
      { title: 'Measurement', purpose: 'KPIs, tracking setup, success thresholds.' }
    ]
  },
  {
    id: 'product-launch', name: 'Product Launch Plan', category: 'Business',
    desc: 'Coordinate a launch across audience, assets and timeline.',
    cards: [
      { title: 'Positioning Statement', purpose: 'For [who] that [need], [product] is [category] that [benefit].' },
      { title: 'Launch Narrative', purpose: 'The story arc of the launch — why now, what changes.' },
      { title: 'Audience Warm-up', purpose: 'Pre-launch content that builds anticipation.' },
      { title: 'Launch Assets', purpose: 'Landing page, demo, emails, social, PR kit.' },
      { title: 'Launch Day Runbook', purpose: 'Hour-by-hour checklist for D-day.' },
      { title: 'Post-launch Follow-up', purpose: 'Onboarding, feedback loops, iteration plan.' },
      { title: 'Metrics', purpose: 'Signups, activation, revenue — targets per week.' }
    ]
  },
  {
    id: 'customer-persona', name: 'Customer Persona', category: 'Business',
    desc: 'A vivid, decision-useful portrait of one customer type.',
    cards: [
      { title: 'Snapshot', purpose: 'Name, age, role, context — make them feel real.' },
      { title: 'Goals', purpose: 'What they\'re trying to achieve (job-to-be-done).' },
      { title: 'Pains & Frustrations', purpose: 'What blocks them today; current workarounds.' },
      { title: 'Buying Triggers', purpose: 'Events that push them to look for a solution.' },
      { title: 'Objections', purpose: 'Why they hesitate to buy — and counters.' },
      { title: 'Watering Holes', purpose: 'Where they hang out, whom they trust.' },
      { title: 'Message That Lands', purpose: 'Words/tone that resonate with this persona.' }
    ]
  },
  {
    id: 'pitch-deck', name: 'Pitch Deck Skeleton', category: 'Business',
    desc: 'The 10 slides investors expect.',
    cards: [
      { title: 'Problem', purpose: 'The painful, expensive, frequent problem.' },
      { title: 'Solution', purpose: 'Your product and its "aha" in one slide.' },
      { title: 'Market', purpose: 'TAM/SAM/SOM with believable logic.' },
      { title: 'Product / Demo', purpose: 'Show, don\'t tell — key screens or flow.' },
      { title: 'Business Model', purpose: 'Who pays, how much, unit economics.' },
      { title: 'Traction', purpose: 'Numbers proving momentum.' },
      { title: 'Competition', purpose: 'Landscape and your durable edge.' },
      { title: 'Team', purpose: 'Why this team wins this market.' },
      { title: 'Financials', purpose: '3-year projections, key assumptions.' },
      { title: 'The Ask', purpose: 'Round size, use of funds, milestones it buys.' }
    ]
  },
  {
    id: 'brand-strategy', name: 'Brand Strategy', category: 'Business',
    desc: 'Define what the brand stands for before designing anything.',
    cards: [
      { title: 'Purpose', purpose: 'Why the brand exists beyond making money.' },
      { title: 'Vision & Mission', purpose: 'Where you\'re going and how you get there.' },
      { title: 'Values', purpose: '3–5 values with behavioural proof, not posters.' },
      { title: 'Audience', purpose: 'Primary and secondary audiences.' },
      { title: 'Personality & Voice', purpose: 'If the brand were a person: tone, vocabulary, humour.' },
      { title: 'Positioning', purpose: 'The space you own in the customer\'s mind.' },
      { title: 'Visual Direction', purpose: 'Moodwords, palette instincts, references.' }
    ]
  },
  {
    id: 'swot', name: 'SWOT Analysis', category: 'Business',
    desc: 'Strengths, Weaknesses, Opportunities, Threats.',
    cards: [
      { title: 'Strengths', purpose: 'Internal advantages — what you do better.' },
      { title: 'Weaknesses', purpose: 'Internal gaps — where you\'re exposed.' },
      { title: 'Opportunities', purpose: 'External trends and openings to exploit.' },
      { title: 'Threats', purpose: 'External risks — competitors, shifts, regulation.' }
    ]
  },

  // ---------------- PERSONAL ----------------
  {
    id: 'goal-setting', name: 'Goal Setting (Quarter)', category: 'Personal',
    desc: 'Turn a vague ambition into a quarter of focused action.',
    cards: [
      { title: 'The One Goal', purpose: 'The single most important outcome for this quarter.' },
      { title: 'Why It Matters', purpose: 'The deeper motivation — connect it to identity.' },
      { title: 'Success Criteria', purpose: 'How you\'ll know, measurably, that you achieved it.' },
      { title: 'Key Actions', purpose: 'The 3–5 weekly behaviours that produce the outcome.' },
      { title: 'Obstacles & Plans', purpose: 'What will get in the way + if-then plans.' },
      { title: 'Review Ritual', purpose: 'When and how you\'ll review progress.' }
    ]
  },
  {
    id: 'personal-brand', name: 'Personal Branding Map', category: 'Personal',
    desc: 'Clarify how you want to be known.',
    cards: [
      { title: 'Known For', purpose: 'The 1–3 topics you want your name attached to.' },
      { title: 'Proof of Work', purpose: 'Projects and artifacts that demonstrate expertise.' },
      { title: 'Story', purpose: 'Your origin story told in 5 sentences.' },
      { title: 'Platforms', purpose: 'Where you show up and the role of each platform.' },
      { title: 'Content Rhythm', purpose: 'Sustainable publishing cadence.' },
      { title: 'Network Moves', purpose: 'People to reach out to and communities to join.' }
    ]
  },
  {
    id: 'weekly-review', name: 'Weekly Review', category: 'Personal',
    desc: 'A repeatable ritual to close one week and aim the next.',
    cards: [
      { title: 'Wins', purpose: 'What went well — celebrate specifics.' },
      { title: 'Lessons', purpose: 'What didn\'t work and what it teaches.' },
      { title: 'Open Loops', purpose: 'Unfinished items to close, delegate or drop.' },
      { title: 'Next Week\'s Big 3', purpose: 'The three outcomes that matter most next week.' },
      { title: 'Energy Audit', purpose: 'What gave and what drained energy.' }
    ]
  },
  {
    id: 'career-plan', name: 'Career Planning', category: 'Personal',
    desc: 'Design the next career move deliberately.',
    cards: [
      { title: 'Current State', purpose: 'Honest audit of role, skills, satisfaction.' },
      { title: 'Desired State', purpose: 'Where you want to be in 2–3 years.' },
      { title: 'Gap Analysis', purpose: 'Skills, experience and relationships missing.' },
      { title: 'Experiments', purpose: 'Small bets to test directions before committing.' },
      { title: 'Skill Plan', purpose: 'What to learn, how, and by when.' },
      { title: 'Allies & Mentors', purpose: 'Who can accelerate this and how to engage them.' }
    ]
  },
  {
    id: 'journaling-frame', name: 'Journaling Frame', category: 'Personal',
    desc: 'Prompts for a deep monthly self-reflection.',
    cards: [
      { title: 'What Happened', purpose: 'Neutral recap of the month\'s key events.' },
      { title: 'How I Felt', purpose: 'Emotional landscape — name the feelings.' },
      { title: 'What I Avoided', purpose: 'The thing you\'re not looking at.' },
      { title: 'What I\'m Grateful For', purpose: 'Specific gratitude, small and large.' },
      { title: 'Intention Ahead', purpose: 'One intention for the coming month.' }
    ]
  },

  // ---------------- WRITING ----------------
  {
    id: 'story-circle', name: "Dan Harmon's Story Circle", category: 'Writing',
    desc: '8-step simplified hero\'s journey for episodic stories.',
    cards: [
      { title: '1. You', purpose: 'A character in a zone of comfort.' },
      { title: '2. Need', purpose: 'But they want something.' },
      { title: '3. Go', purpose: 'They enter an unfamiliar situation.' },
      { title: '4. Search', purpose: 'They adapt to it.' },
      { title: '5. Find', purpose: 'They get what they wanted.' },
      { title: '6. Take', purpose: 'They pay a heavy price for it.' },
      { title: '7. Return', purpose: 'They return to their familiar situation.' },
      { title: '8. Change', purpose: 'Having changed.' }
    ]
  },
  {
    id: 'world-building', name: 'World Building Bible', category: 'Writing',
    desc: 'The essential dimensions of a fictional world.',
    cards: [
      { title: 'Core Concept', purpose: 'The one big idea that makes this world unique.' },
      { title: 'Geography & Places', purpose: 'Key locations and how they shape life.' },
      { title: 'History & Lore', purpose: 'The past events everyone still feels.' },
      { title: 'Power & Politics', purpose: 'Who rules, how, and who wants to change that.' },
      { title: 'Culture & Daily Life', purpose: 'Food, rituals, taboos, language flavour.' },
      { title: 'Rules & Magic/Tech', purpose: 'The system\'s rules, costs and limits.' },
      { title: 'Conflicts', purpose: 'The fault lines that generate stories.' }
    ]
  },
  {
    id: 'novel-outline', name: 'Novel Outline (Three Acts)', category: 'Writing',
    desc: 'A pragmatic three-act novel skeleton.',
    cards: [
      { title: 'Premise', purpose: 'Protagonist + goal + obstacle + stakes in one sentence.' },
      { title: 'Act 1 — Setup', purpose: 'Normal world, inciting incident, first plot point.' },
      { title: 'Act 2a — Reaction', purpose: 'Protagonist reacts, explores, gathers allies.' },
      { title: 'Midpoint Shift', purpose: 'Revelation that turns reaction into action.' },
      { title: 'Act 2b — Action', purpose: 'Proactive pursuit; stakes escalate to crisis.' },
      { title: 'Act 3 — Resolution', purpose: 'Climax, sacrifice, resolution, denouement.' },
      { title: 'Theme Threads', purpose: 'Motifs and thematic beats woven across acts.' },
      { title: 'Subplots', purpose: 'Secondary arcs and where they intersect the spine.' }
    ]
  },
  {
    id: 'scene-checklist', name: 'Scene Design Checklist', category: 'Writing',
    desc: 'Make every scene earn its place.',
    cards: [
      { title: 'Scene Goal', purpose: 'What the POV character wants in this scene.' },
      { title: 'Conflict', purpose: 'What opposes them here.' },
      { title: 'Outcome / Disaster', purpose: 'Yes-but or no-and — how it ends worse.' },
      { title: 'Change of Value', purpose: 'What emotional charge flips (+ to − or − to +).' },
      { title: 'Sensory Anchor', purpose: 'The concrete image/sound that grounds the scene.' },
      { title: 'Exit Hook', purpose: 'The question pulling the reader to the next scene.' }
    ]
  }
];

// ============================================================
// Templates — pre-arranged editable boards (walls + cards)
// Items use relative coordinates; inserted at drop point.
// All content is a starting point, never locked.
// ============================================================

const TEMPLATES = [
  {
    id: 'kanban', name: 'Kanban Board', category: 'Productivity',
    desc: 'Backlog → Doing → Review → Done columns.',
    items: [
      { type: 'wall', title: 'Backlog', x: 0, y: 0, w: 260, h: 620, color: '#3d4451' },
      { type: 'wall', title: 'Doing', x: 280, y: 0, w: 260, h: 620, color: '#4a4458' },
      { type: 'wall', title: 'Review', x: 560, y: 0, w: 260, h: 620, color: '#3f4d5c' },
      { type: 'wall', title: 'Done', x: 840, y: 0, w: 260, h: 620, color: '#3c5247' },
      { type: 'note', title: 'First task', content: 'Describe the task…', x: 20, y: 60, w: 220, h: 100, color: '#f5d76e' },
      { type: 'note', title: 'Another task', content: '', x: 20, y: 180, w: 220, h: 100, color: '#f5d76e' }
    ]
  },
  {
    id: 'mindmap', name: 'Mind Map', category: 'Thinking',
    desc: 'Central topic with radiating branches.',
    items: [
      { type: 'note', title: 'Central Topic', content: 'The core idea', x: 400, y: 250, w: 220, h: 90, color: '#8ab4f8', key: 'c' },
      { type: 'note', title: 'Branch 1', content: '', x: 80, y: 60, w: 180, h: 80, color: '#f5d76e', key: 'b1' },
      { type: 'note', title: 'Branch 2', content: '', x: 760, y: 60, w: 180, h: 80, color: '#f5d76e', key: 'b2' },
      { type: 'note', title: 'Branch 3', content: '', x: 80, y: 460, w: 180, h: 80, color: '#f5d76e', key: 'b3' },
      { type: 'note', title: 'Branch 4', content: '', x: 760, y: 460, w: 180, h: 80, color: '#f5d76e', key: 'b4' }
    ],
    connections: [['c', 'b1'], ['c', 'b2'], ['c', 'b3'], ['c', 'b4']]
  },
  {
    id: 'research-board', name: 'Research Board', category: 'Thinking',
    desc: 'Collect sources, quotes and synthesis in zones.',
    items: [
      { type: 'wall', title: 'Sources', x: 0, y: 0, w: 420, h: 520, color: '#3f4d5c' },
      { type: 'wall', title: 'Key Quotes & Facts', x: 440, y: 0, w: 420, h: 520, color: '#4a4458' },
      { type: 'wall', title: 'Synthesis / So What', x: 880, y: 0, w: 420, h: 520, color: '#3c5247' },
      { type: 'note', title: 'Research Question', content: 'What exactly am I trying to find out?', x: 20, y: -120, w: 400, h: 90, color: '#8ab4f8' }
    ]
  },
  {
    id: 'storyboard', name: 'Storyboard', category: 'Film',
    desc: 'A 2×4 grid of frames with captions.',
    items: Array.from({ length: 8 }, (_, i) => ({
      type: 'note', title: `Frame ${i + 1}`, content: 'Action / camera / dialogue…',
      x: (i % 4) * 260, y: Math.floor(i / 4) * 220, w: 240, h: 190, color: '#e8eaed'
    }))
  },
  {
    id: 'story-plan', name: 'Story Plan', category: 'Writing',
    desc: 'Premise, characters, world and act zones.',
    items: [
      { type: 'note', title: 'Premise', content: 'One-sentence story premise…', x: 0, y: 0, w: 320, h: 110, color: '#8ab4f8' },
      { type: 'wall', title: 'Characters', x: 0, y: 140, w: 400, h: 380, color: '#4a4458' },
      { type: 'wall', title: 'World', x: 420, y: 140, w: 400, h: 380, color: '#3f4d5c' },
      { type: 'wall', title: 'Act I', x: 0, y: 560, w: 270, h: 320, color: '#3d4451' },
      { type: 'wall', title: 'Act II', x: 290, y: 560, w: 270, h: 320, color: '#3d4451' },
      { type: 'wall', title: 'Act III', x: 580, y: 560, w: 270, h: 320, color: '#3d4451' }
    ]
  },
  {
    id: 'moodboard', name: 'Moodboard', category: 'Design',
    desc: 'Zones for palette, references, typography and textures.',
    items: [
      { type: 'wall', title: 'Color & Light', x: 0, y: 0, w: 420, h: 360, color: '#4a4458' },
      { type: 'wall', title: 'References', x: 440, y: 0, w: 560, h: 360, color: '#3f4d5c' },
      { type: 'wall', title: 'Type & Texture', x: 0, y: 380, w: 420, h: 320, color: '#3c5247' },
      { type: 'wall', title: 'Do NOT want', x: 440, y: 380, w: 560, h: 320, color: '#5c3f44' },
      { type: 'note', title: 'Mood in 3 words', content: '…', x: 20, y: -110, w: 300, h: 80, color: '#f5d76e' }
    ]
  },
  {
    id: 'second-brain', name: 'Second Brain', category: 'Productivity',
    desc: 'PARA-style zones: Projects, Areas, Resources, Archive.',
    items: [
      { type: 'wall', title: 'Projects (active)', x: 0, y: 0, w: 360, h: 460, color: '#3c5247' },
      { type: 'wall', title: 'Areas (ongoing)', x: 380, y: 0, w: 360, h: 460, color: '#3f4d5c' },
      { type: 'wall', title: 'Resources', x: 760, y: 0, w: 360, h: 460, color: '#4a4458' },
      { type: 'wall', title: 'Archive', x: 1140, y: 0, w: 360, h: 460, color: '#3d4451' },
      { type: 'todo', title: 'Inbox', todos: [{ text: 'Capture anything here first', done: false }], x: 0, y: -180, w: 300, h: 140, color: '#f5d76e' }
    ]
  },
  {
    id: 'film-plan', name: 'Film Plan', category: 'Film',
    desc: 'Development → Pre-production → Shoot → Post lanes.',
    items: [
      { type: 'wall', title: 'Development', x: 0, y: 0, w: 300, h: 560, color: '#3d4451' },
      { type: 'wall', title: 'Pre-production', x: 320, y: 0, w: 300, h: 560, color: '#3f4d5c' },
      { type: 'wall', title: 'Shoot', x: 640, y: 0, w: 300, h: 560, color: '#4a4458' },
      { type: 'wall', title: 'Post', x: 960, y: 0, w: 300, h: 560, color: '#3c5247' },
      { type: 'todo', title: 'Development tasks', todos: [{ text: 'Lock logline', done: false }, { text: 'Finish treatment', done: false }], x: 20, y: 60, w: 260, h: 150, color: '#e8eaed' }
    ]
  },
  {
    id: 'character-profile', name: 'Character Profile', category: 'Writing',
    desc: 'A one-glance character sheet.',
    items: [
      { type: 'note', title: 'Name & Role', content: '', x: 0, y: 0, w: 300, h: 90, color: '#8ab4f8' },
      { type: 'note', title: 'Appearance', content: '', x: 0, y: 110, w: 300, h: 130, color: '#e8eaed' },
      { type: 'note', title: 'Want vs Need', content: 'Want: …\nNeed: …', x: 320, y: 0, w: 300, h: 130, color: '#f5d76e' },
      { type: 'note', title: 'Backstory Wound', content: '', x: 320, y: 150, w: 300, h: 130, color: '#f0a8a8' },
      { type: 'note', title: 'Voice / Quirks', content: '', x: 0, y: 260, w: 300, h: 120, color: '#a8d5b5' },
      { type: 'note', title: 'Arc', content: 'Starts as … ends as …', x: 320, y: 300, w: 300, h: 110, color: '#c5b3e6' }
    ]
  },
  {
    id: 'launch-tasks', name: 'Launch / Task Management', category: 'Productivity',
    desc: 'Timeline lanes with checklists per phase.',
    items: [
      { type: 'wall', title: 'T-4 weeks', x: 0, y: 0, w: 280, h: 420, color: '#3d4451' },
      { type: 'wall', title: 'T-2 weeks', x: 300, y: 0, w: 280, h: 420, color: '#3f4d5c' },
      { type: 'wall', title: 'Launch week', x: 600, y: 0, w: 280, h: 420, color: '#5c4a3f' },
      { type: 'wall', title: 'Post-launch', x: 900, y: 0, w: 280, h: 420, color: '#3c5247' },
      { type: 'todo', title: 'Checklist', todos: [{ text: 'Define success metric', done: false }], x: 20, y: 60, w: 240, h: 140, color: '#f5d76e' }
    ]
  },
  {
    id: 'ai-image-workflow', name: 'AI Image Workflow', category: 'AI',
    desc: 'Prompt → variations → picks → final pipeline.',
    items: [
      { type: 'wall', title: '1 · Prompt Drafts', x: 0, y: 0, w: 340, h: 460, color: '#3f4d5c' },
      { type: 'wall', title: '2 · Generations', x: 360, y: 0, w: 480, h: 460, color: '#4a4458' },
      { type: 'wall', title: '3 · Picks', x: 860, y: 0, w: 340, h: 460, color: '#3c5247' },
      { type: 'note', title: 'Style recipe', content: 'Reusable style suffix: lighting, lens, palette, mood…', x: 20, y: -130, w: 400, h: 100, color: '#f5d76e' }
    ]
  },
  {
    id: 'agency-hub', name: 'Agency Hub', category: 'Business',
    desc: 'Clients, active work, pipeline and internal ops in one view.',
    items: [
      { type: 'wall', title: 'Clients', x: 0, y: 0, w: 340, h: 480, color: '#3f4d5c' },
      { type: 'wall', title: 'Active Projects', x: 360, y: 0, w: 420, h: 480, color: '#3c5247' },
      { type: 'wall', title: 'Pipeline / Leads', x: 800, y: 0, w: 340, h: 480, color: '#5c4a3f' },
      { type: 'wall', title: 'Internal Ops', x: 1160, y: 0, w: 340, h: 480, color: '#3d4451' }
    ]
  }
];

const TACTIC_CATEGORIES = ['Filmmaking', 'Content Creation', 'Business', 'Personal', 'Writing'];
