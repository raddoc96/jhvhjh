export class AgentService {
  constructor(
    private geminiService: any,
    private log: (message: string) => void,
    private handlePauseForUserTasks: (tasks: any[]) => Promise<Record<string, string>>,
    private agentWorkerModel: any
  ) {}

  async run(initialData: any, existingState?: any) {
    console.log("Agent run initiated");
    return {
      finalHtml: "<div>Agent Result</div>",
      theme: "default",
      userImages: [],
    };
  }
}
