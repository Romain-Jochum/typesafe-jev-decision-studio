import type {
  ChoiceCriteriaMap,
  ChoiceQuestionDefinition,
  NoulQuestionDefinition,
  ScoreQuestionDefinition,
  QuestionType,
} from "./types";

export const SELF_HOSTED_FOLDERS: string[] = [
  "Analytics",
  "Archiving and Digital Preservation (DP)",
  "Automation",
  "Backup",
  "Blogging Platforms",
  "Booking and Scheduling",
  "Bookmarks and Link Sharing",
  "Calendar & Contacts",
  "Communication - Custom Communication Systems",
  "Communication - Email - Complete Solutions",
  "Communication - Email - Mail Delivery Agents",
  "Communication - Email - Mail Transfer Agents",
  "Communication - Email - Mailing Lists and Newsletters",
  "Communication - Email - Webmail Clients",
  "Communication - IRC",
  "Communication - SIP",
  "Communication - Social Networks and Forums",
  "Communication - Video Conferencing",
  "Communication - XMPP - Servers",
  "Communication - XMPP - Web Clients",
  "Community-Supported Agriculture (CSA)",
  "Conference Management",
  "Content Management Systems (CMS)",
  "Customer Relationship Management (CRM)",
  "Database Management",
  "DNS",
  "Document Management",
  "Document Management - E-books",
  "Document Management - Institutional Repository and Digital Library Software",
  "Document Management - Integrated Library Systems (ILS)",
  "E-commerce",
  "Federated Identity & Authentication",
  "Feed Readers",
  "File Transfer & Synchronization",
  "File Transfer - Distributed Filesystems",
  "File Transfer - Object Storage & File Servers",
  "File Transfer - Peer-to-peer Filesharing",
  "File Transfer - Single-click & Drag-n-drop Upload",
  "File Transfer - Web-based File Managers",
  "Games",
  "Games - Administrative Utilities & Control Panels",
  "Genealogy",
  "Generative Artificial Intelligence (GenAI)",
  "Groupware",
  "Health and Fitness",
  "Human Resources Management (HRM)",
  "Identity Management",
  "Internet of Things (IoT)",
  "Inventory Management",
  "Knowledge Management Tools",
  "Learning and Courses",
  "Manufacturing",
  "Maps and Global Positioning System (GPS)",
  "Media Management",
  "Media Streaming",
  "Media Streaming - Audio Streaming",
  "Media Streaming - Multimedia Streaming",
  "Media Streaming - Video Streaming",
  "Miscellaneous",
  "Money, Budgeting & Management",
  "Monitoring & Status Pages",
  "Network Utilities",
  "Note-taking & Editors",
  "Office Suites",
  "Password Managers",
  "Pastebins",
  "Personal Dashboards",
  "Photo Galleries",
  "Polls and Events",
  "Proxy",
  "Recipe Management",
  "Remote Access",
  "Resource Planning",
  "Search Engines",
  "Self-hosting Solutions",
  "Software Development",
  "Software Development - API Management",
  "Software Development - Continuous Integration & Deployment",
  "Software Development - FaaS & Serverless",
  "Software Development - Feature Toggle",
  "Software Development - IDE & Tools",
  "Software Development - Localization",
  "Software Development - Low Code",
  "Software Development - Project Management",
  "Software Development - Testing",
  "Static Site Generators",
  "Task Management & To-do Lists",
  "Ticketing",
  "Time Tracking",
  "Travel Organization",
  "URL Shorteners",
  "Video Surveillance",
  "VPN",
  "Web Servers",
  "Wikis",
];

export interface PresetItem {
  id: string;
  title: string;
  description: string;
  questionType: QuestionType;
  state: string;
  instructions: string;
  options?: string[];
  criteria?: ChoiceCriteriaMap;
  rubric?: string[];
}

export const SELF_HOSTED_PRESET: PresetItem = {
  id: "self-hosted-folders",
  title: "Self-Hosted Projects Classification (90+ Folders)",
  description:
    'Identify the most probable folder for self-hosted projects about "personal organization, to-do tracker..."',
  questionType: "choice",
  state: "personal organization, to-do tracker...",
  instructions:
    "What is the most probable folder to contain self hosted projects about this topic?",
  options: SELF_HOSTED_FOLDERS,
};

export const QUESTION_PRESETS: Record<QuestionType, PresetItem[]> = {
  choice: [
    SELF_HOSTED_PRESET,
    {
      id: "support-ticket-routing",
      title: "Support Ticket Department Routing",
      description: "Route an incoming customer issue to the right team",
      questionType: "choice",
      state:
        "Hi, I was double billed on my monthly subscription invoice and need a refund immediately.",
      instructions: "Which department should take ownership of this ticket?",
      options: [
        "Billing & Invoices",
        "Technical Support",
        "Account Security",
        "Sales & Upgrades",
      ],
    },
    {
      id: "code-language-detection",
      title: "Programming Language Classifier",
      description: "Detect the programming language from a code snippet",
      questionType: "choice",
      state: "const [count, setCount] = useState<number>(0);",
      instructions: "What programming language or framework is this snippet written in?",
      options: [
        "TypeScript / React",
        "Python",
        "Go",
        "Rust",
        "PHP",
        "C++",
      ],
    },
  ],
  noul: [
    {
      id: "todo-relevance-check",
      title: "Is this a To-do / Task Management tool?",
      description: "Binary verification of task management domain",
      questionType: "noul",
      state: "personal organization, to-do tracker...",
      instructions: "Does this topic describe a task management or to-do tracking system?",
    },
    {
      id: "urgency-detector",
      title: "Urgent Incident Check",
      description: "Detect if an incoming report indicates high urgency or production outage",
      questionType: "noul",
      state: "Our production database is returning 500 errors and users cannot check out!",
      instructions: "Does this message report an urgent, blocking production outage?",
    },
    {
      id: "personal-data-breach",
      title: "GDPR 72h Breach Notification",
      description: "GDPR compliance check for data breach reporting obligation",
      questionType: "noul",
      state: "A database backup containing 5,000 user plaintext emails was accidentally made public on an S3 bucket.",
      instructions: "Must this personal data breach be reported to the supervisory authority within 72 hours?",
    },
  ],
  score: [
    {
      id: "organization-relevance-score",
      title: "Organization Tool Relevance Rubric",
      description: "Grade how strongly a description aligns with productivity & organization",
      questionType: "score",
      state: "personal organization, to-do tracker...",
      instructions: "How strongly does this state represent personal organization and productivity tools?",
      rubric: [
        "Completely Unrelated (no connection to organization)",
        "Tangentially Related (e.g. general utility or storage)",
        "Moderately Related (e.g. personal notes or calendar)",
        "Direct Match (core focus is personal organization, tasks, or to-do lists)",
      ],
    },
    {
      id: "customer-frustration",
      title: "Customer Sentiment / Frustration Level",
      description: "Gauge customer emotional state along a calibrated rubric",
      questionType: "score",
      state: "I have waited 4 days with zero response. This is unacceptable and costing me business!",
      instructions: "How frustrated does the customer appear in this message?",
      rubric: [
        "Calm and neutral inquiry",
        "Slightly disappointed or inquiring about delays",
        "Noticeably frustrated and impatient",
        "Extremely angry, aggressive, or demanding immediate escalation",
      ],
    },
    {
      id: "gdpr-penalty-severity",
      title: "GDPR Penalty Severity",
      description: "Assess severity of penalty provision",
      questionType: "score",
      state: "Art. 83(5) GDPR provides for fines up to EUR 20,000,000, or in the case of an undertaking, up to 4% of total worldwide annual turnover.",
      instructions: "How severe are the administrative penalties described here?",
      rubric: [
        "Negligible or zero impact",
        "Minor symbolic fine",
        "Substantial fine impacting departmental budget",
        "Severe, material to global enterprise turnover",
      ],
    },
  ],
};

export function buildChoiceQuestion(
  instructions: string,
  optionsOrCriteria: string[] | ChoiceCriteriaMap
): ChoiceQuestionDefinition {
  let criteria: ChoiceCriteriaMap;
  if (Array.isArray(optionsOrCriteria)) {
    criteria = {};
    for (const opt of optionsOrCriteria) {
      criteria[opt] = null;
    }
  } else {
    criteria = optionsOrCriteria;
  }

  return {
    type: "choice",
    instructions,
    criteria,
  };
}

export function buildNoulQuestion(instructions: string): NoulQuestionDefinition {
  return {
    type: "noul",
    instructions,
  };
}

export function buildScoreQuestion(
  instructions: string,
  rubric: string[]
): ScoreQuestionDefinition {
  return {
    type: "score",
    instructions,
    criteria: rubric,
  };
}
