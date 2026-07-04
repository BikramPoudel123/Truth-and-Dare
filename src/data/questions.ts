export type QCategory = "truth" | "dare";
export type QTag = "fun" | "life" | "hot" | "connect" | "spicy" | "deep";

export interface Question {
  id: number;
  type: QCategory;
  text: string;
  tags: QTag[];
}

export const QUESTIONS: Question[] = [
  // ── TRUTHS ──────────────────────────────────────────────────────────────────
  { id: 1,  type: "truth", text: "What's the most embarrassing thing you've done in public?", tags: ["fun"] },
  { id: 2,  type: "truth", text: "Have you ever lied to get out of trouble? What was it?", tags: ["life"] },
  { id: 3,  type: "truth", text: "What's your biggest insecurity right now?", tags: ["deep", "life"] },
  { id: 4,  type: "truth", text: "Who was your first crush and do they know?", tags: ["connect", "fun"] },
  { id: 5,  type: "truth", text: "What's something you've never told anyone?", tags: ["deep"] },
  { id: 6,  type: "truth", text: "Have you ever cheated on a test or someone?", tags: ["life", "spicy"] },
  { id: 7,  type: "truth", text: "What's the most childish thing you still do?", tags: ["fun"] },
  { id: 8,  type: "truth", text: "What's the weirdest dream you've ever had?", tags: ["fun", "deep"] },
  { id: 9,  type: "truth", text: "What's one thing you would change about your appearance?", tags: ["life", "deep"] },
  { id: 10, type: "truth", text: "Have you ever had feelings for someone you shouldn't have?", tags: ["hot", "spicy"] },
  { id: 11, type: "truth", text: "What's the worst date you've ever been on?", tags: ["fun", "connect"] },
  { id: 12, type: "truth", text: "What's the most money you've spent on something stupid?", tags: ["fun", "life"] },
  { id: 13, type: "truth", text: "What's a habit you're secretly ashamed of?", tags: ["deep", "life"] },
  { id: 14, type: "truth", text: "If you could go back and undo one decision, what would it be?", tags: ["deep", "life"] },
  { id: 15, type: "truth", text: "What's the most toxic thing you've done in a relationship?", tags: ["spicy", "hot"] },
  { id: 16, type: "truth", text: "Who is one person in your life you genuinely don't trust?", tags: ["deep", "spicy"] },
  { id: 17, type: "truth", text: "What's your most controversial opinion?", tags: ["spicy", "fun"] },
  { id: 18, type: "truth", text: "Have you ever ghosted someone? Tell the story.", tags: ["connect", "spicy"] },
  { id: 19, type: "truth", text: "What's something you pretend to enjoy but actually hate?", tags: ["fun", "life"] },
  { id: 20, type: "truth", text: "What's the wildest lie you've told and got away with?", tags: ["fun", "spicy"] },
  { id: 21, type: "truth", text: "What do you find most attractive in a person?", tags: ["hot", "connect"] },
  { id: 22, type: "truth", text: "Have you ever stalked someone's social media obsessively?", tags: ["spicy", "fun"] },
  { id: 23, type: "truth", text: "What's your biggest regret in the last year?", tags: ["deep", "life"] },
  { id: 24, type: "truth", text: "What's your most used app and why is it embarrassing?", tags: ["fun"] },
  { id: 25, type: "truth", text: "If your texts were shown publicly right now, how bad would it be?", tags: ["spicy", "hot"] },
  { id: 26, type: "truth", text: "What's the longest you've gone without showering?", tags: ["fun"] },
  { id: 27, type: "truth", text: "What song do you secretly belt when alone?", tags: ["fun"] },
  { id: 28, type: "truth", text: "What's one deal-breaker in a relationship for you?", tags: ["connect", "life"] },
  { id: 29, type: "truth", text: "Who do you secretly compare yourself to?", tags: ["deep", "life"] },
  { id: 30, type: "truth", text: "What's something you're afraid to admit you still believe in?", tags: ["deep"] },
  { id: 31, type: "truth", text: "What's the most messed up thought you've had today?", tags: ["spicy", "deep"] },
  { id: 32, type: "truth", text: "What's a compliment you received that you didn't deserve?", tags: ["fun", "life"] },
  { id: 33, type: "truth", text: "Have you ever faked being sick to avoid something? What?", tags: ["fun"] },
  { id: 34, type: "truth", text: "What emotion do you hide from people most often?", tags: ["deep", "life"] },
  { id: 35, type: "truth", text: "What's something your parents don't know about you?", tags: ["spicy", "life"] },

  // ── DARES ───────────────────────────────────────────────────────────────────
  { id: 36, type: "dare", text: "Send the last photo in your camera roll right now.", tags: ["fun", "spicy"] },
  { id: 37, type: "dare", text: "Text a random contact 'I miss you' and screenshot the reply.", tags: ["fun", "connect"] },
  { id: 38, type: "dare", text: "Do your best impression of the other player for 30 seconds.", tags: ["fun"] },
  { id: 39, type: "dare", text: "Post an embarrassing throwback photo on your story for 10 mins.", tags: ["fun", "spicy"] },
  { id: 40, type: "dare", text: "Call someone and sing 'Happy Birthday' — even if it's not their birthday.", tags: ["fun"] },
  { id: 41, type: "dare", text: "Show your most recent DM conversation (first 3 messages).", tags: ["spicy", "hot"] },
  { id: 42, type: "dare", text: "Do 20 push-ups right now. Show proof.", tags: ["fun"] },
  { id: 43, type: "dare", text: "Eat a spoonful of something weird from your kitchen.", tags: ["fun", "spicy"] },
  { id: 44, type: "dare", text: "Send a voice note to someone saying 'you up?' in a flirty voice.", tags: ["hot", "spicy"] },
  { id: 45, type: "dare", text: "Change your profile picture to a potato for the next 24 hours.", tags: ["fun"] },
  { id: 46, type: "dare", text: "Write a dramatic 3-sentence love poem about the other player right now.", tags: ["fun", "hot"] },
  { id: 47, type: "dare", text: "Describe yourself as if you were a bad Tinder bio.", tags: ["fun", "connect"] },
  { id: 48, type: "dare", text: "Show the inside of your bag/pockets right now.", tags: ["fun", "life"] },
  { id: 49, type: "dare", text: "Send 'we need to talk 😬' to someone and wait for their response.", tags: ["spicy", "fun"] },
  { id: 50, type: "dare", text: "Do the worm or attempt it. Record proof.", tags: ["fun"] },
  { id: 51, type: "dare", text: "Write the other player's name on your arm in marker.", tags: ["hot", "fun"] },
  { id: 52, type: "dare", text: "Screenshot your screen time and share it. No cropping.", tags: ["life", "spicy"] },
  { id: 53, type: "dare", text: "Recreate the last selfie you took, but 10x more dramatic.", tags: ["fun"] },
  { id: 54, type: "dare", text: "Say 5 genuine compliments about the other player out loud.", tags: ["connect", "hot"] },
  { id: 55, type: "dare", text: "Set your status to 'I eat cereal with water' for 1 hour.", tags: ["fun"] },
  { id: 56, type: "dare", text: "Order something random from a delivery app right now (min $5).", tags: ["spicy", "fun"] },
  { id: 57, type: "dare", text: "Video call someone right now and say 'I just wanted to see your face'.", tags: ["connect", "hot"] },
  { id: 58, type: "dare", text: "Screenshot your most toxic messages thread (blur names). Show it.", tags: ["spicy", "hot"] },
  { id: 59, type: "dare", text: "Attempt a handstand. Photo proof required.", tags: ["fun"] },
  { id: 60, type: "dare", text: "Post a 30-second video of you explaining why you're a terrible cook.", tags: ["fun", "life"] },
  { id: 61, type: "dare", text: "Text someone 'I've been thinking about you...' and see how they respond.", tags: ["hot", "connect"] },
  { id: 62, type: "dare", text: "Go outside and wave at 3 strangers. Show proof.", tags: ["fun"] },
  { id: 63, type: "dare", text: "Drink a glass of water as dramatically as possible. Record it.", tags: ["fun"] },
  { id: 64, type: "dare", text: "Send your most used emoji to 5 different people with no context.", tags: ["fun", "spicy"] },
  { id: 65, type: "dare", text: "Look into the camera for 30 seconds straight without blinking.", tags: ["fun", "hot"] },
  { id: 66, type: "dare", text: "Show a photo that you've never posted because it's too embarrassing.", tags: ["spicy", "deep"] },
  { id: 67, type: "dare", text: "Write a Yelp review of yourself as if you were a restaurant.", tags: ["fun"] },
  { id: 68, type: "dare", text: "Flex in the mirror for 1 minute while saying motivational things to yourself.", tags: ["fun", "life"] },
  { id: 69, type: "dare", text: "Send a 'good morning ☀️' text to your most recent contact right now.", tags: ["connect", "fun"] },
  { id: 70, type: "dare", text: "Tell the other player your honest first impression of them.", tags: ["hot", "deep", "connect"] },
];

export const TRUTH_QUESTIONS = QUESTIONS.filter((q) => q.type === "truth");
export const DARE_QUESTIONS  = QUESTIONS.filter((q) => q.type === "dare");

export function getQuestionsByTag(tag: QTag): Question[] {
  return QUESTIONS.filter((q) => q.tags.includes(tag));
}
