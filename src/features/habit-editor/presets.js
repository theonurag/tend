export const HABIT_PRESETS = {
  walk: { name: "Take a daily walk", why: "I want more movement, daylight, and mental space", cue: "After lunch", action: "Go outside for a walk", minimum: "Walk for five minutes" },
  exercise: { name: "Move my body", why: "I want more energy, mobility, and physical wellbeing", cue: "After I change into comfortable clothes", action: "Do a movement session I enjoy", minimum: "Move for two minutes" },
  strength: { name: "Build strength", why: "I want to feel stronger and support my long-term health", cue: "After my first break", action: "Do a strength session", minimum: "Do one set of one exercise" },
  stretch: { name: "Stretch daily", why: "I want my body to feel less stiff", cue: "After I close my laptop", action: "Do a short stretch routine", minimum: "Stretch for one minute" },
  water: { name: "Drink more water", why: "I want to stay hydrated and feel more alert", cue: "After I wake up", action: "Drink a glass of water", minimum: "Take five sips" },
  vegetables: { name: "Eat more vegetables", why: "I want meals that support my health and energy", cue: "When I prepare my main meal", action: "Add vegetables to my meal", minimum: "Add one bite-sized serving" },
  sleep: { name: "Keep a sleep routine", why: "I want steadier energy and better rest", cue: "Thirty minutes before bedtime", action: "Begin my wind-down routine", minimum: "Dim the lights and put my phone away" },
  medication: { name: "Take prescribed medication", why: "I want to follow the care plan I made with my healthcare professional", cue: "At the time listed in my prescription", action: "Take my prescribed medication as directed", minimum: "Put it somewhere visible and check the instructions" },
  floss: { name: "Floss my teeth", why: "I want to care for my teeth and gums", cue: "After I brush my teeth at night", action: "Floss my teeth", minimum: "Floss one tooth" },
  sunlight: { name: "Get morning daylight", why: "I want to support my energy and daily rhythm", cue: "After I wake up", action: "Step outside or sit near a bright window", minimum: "Get one minute of daylight" },
  meditate: { name: "Meditate", why: "I want to respond with more calm and attention", cue: "After my morning drink", action: "Sit and meditate", minimum: "Take three mindful breaths" },
  breathe: { name: "Pause and breathe", why: "I want to create a moment of calm during my day", cue: "When I notice tension", action: "Pause for slow, steady breaths", minimum: "Take one slow breath" },
  journal: { name: "Write in a journal", why: "I want space to understand my thoughts and feelings", cue: "After I make my evening drink", action: "Write in my journal", minimum: "Write one sentence" },
  gratitude: { name: "Practice gratitude", why: "I want to notice what is already going well", cue: "After dinner", action: "Write down something I appreciate", minimum: "Write one sentence" },
  phone: { name: "Start without my phone", why: "I want to choose how my day begins", cue: "When I wake up", action: "Leave my phone alone until after breakfast", minimum: "Wait five minutes before checking it" },
  read: { name: "Read every day", why: "I want to learn and make space away from scrolling", cue: "After I get into bed", action: "Read a book", minimum: "Read one page" },
  learn: { name: "Learn something new", why: "I want to keep growing with steady practice", cue: "After my first break", action: "Study a skill I care about", minimum: "Practice for five minutes" },
  focus: { name: "Do focused work", why: "I want to make meaningful progress without constant switching", cue: "After I choose my most important task", action: "Work with distractions put away", minimum: "Focus for five minutes" },
  plan: { name: "Plan tomorrow", why: "I want to begin each day with clarity", cue: "Before I finish work", action: "Write tomorrow’s priorities", minimum: "Write one priority" },
  review: { name: "Review my day", why: "I want to learn from my days instead of letting them blur together", cue: "Before I begin my bedtime routine", action: "Reflect on what went well and what I learned", minimum: "Write down one observation" },
  connect: { name: "Connect with someone", why: "I want to nurture the relationships that matter to me", cue: "After my afternoon break", action: "Reach out with genuine attention", minimum: "Send one thoughtful message" },
  tidy: { name: "Reset my space", why: "I want my surroundings to feel calmer and easier to use", cue: "Before I finish the day", action: "Put my space back in order", minimum: "Put away one item" },
  money: { name: "Check my spending", why: "I want to understand my money and make intentional choices", cue: "After I open my banking app", action: "Review and categorize recent spending", minimum: "Review one transaction" },
  outdoors: { name: "Spend time outdoors", why: "I want more fresh air, daylight, and connection with my surroundings", cue: "After lunch", action: "Go outside without multitasking", minimum: "Step outside for one minute" }
};

export const PRESET_GROUPS = [
  { label: "Physical wellbeing", keys: ["walk", "exercise", "strength", "stretch", "water", "vegetables", "sleep", "medication", "floss", "sunlight"] },
  { label: "Mental wellbeing", keys: ["meditate", "breathe", "journal", "gratitude", "phone"] },
  { label: "Growth and focus", keys: ["read", "learn", "focus", "plan", "review"] },
  { label: "Life and connection", keys: ["connect", "tidy", "money", "outdoors"] }
];
