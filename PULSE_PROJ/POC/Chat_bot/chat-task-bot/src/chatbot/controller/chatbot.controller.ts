import { Controller, Post, Body, Inject, Req, Res } from '@nestjs/common';
import { Pool } from 'pg';
import { WinstonLoggerService } from 'src/winstonlogger/winstonlogger.service';
import { ChatService } from '../service/chat.servcie'; // import your async messaging service
import type { Response } from 'express';


@Controller('chatbot')
export class ChatbotController {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    protected wl: WinstonLoggerService,
    private readonly chatService: ChatService,
  ) {}

  infoCommonLogger = (request: any) => {
    this.wl.log(`${request.method} ${request.url} - Incoming request`);
    console.log(`[INFO] Incoming request: ${request.method} ${request.url}`);
  };

  errorCommonLogger = (request: any, error: any) => {
    this.wl.error(`${request.method} ${request.url} - ${error}`);
    console.error(`[ERROR] ${request.method} ${request.url} -`, error);
  };

  @Post('webhook')
  async handleMessage(@Body() body: any, @Req() req: any, @Res() res: Response) {
    this.infoCommonLogger(req);
    console.log('Body received:', JSON.stringify(body, null, 2));

    try {
      const text =
        body?.message?.text?.toLowerCase() ||
        body?.chat?.messagePayload?.message?.text?.toLowerCase() ||
        '';

      const userEmail =
        body?.user?.email ||
        body?.message?.sender?.email ||
        body?.chat?.user?.email ||
        body?.chat?.messagePayload?.message?.sender?.email ||
        'unknown@user.com';

      const spaceName =
        body?.chat?.messagePayload?.space?.name ||
        body?.space?.name ||
        '';

      // Send immediate synchronous response first to avoid "not responding" error
      res.status(200).json({ text: 'Processing your request, please wait...' });

      let reply: any = null;

      // Your existing logic to build the actual reply, for example:
      if (text.includes('add task')) {
        this.wl.log(`[INFO] Triggered Add Tasks card by ${userEmail}`);
        reply = {
          cardsV2: [
            {
              cardId: 'add_tasks_card',
              card: {
                header: {
                  title: "🗓️ Add Today's Tasks",
                  subtitle: "List tasks separated by commas",
                },
                sections: [
                  {
                    widgets: [
                      {
                        textInput: {
                          name: "tasks",
                          label: "Enter tasks (comma-separated)",
                          hintText: "Example: Prepare report, Review PR, Call client",
                        },
                      },
                      {
                        buttonList: {
                          buttons: [
                            {
                              text: "Submit",
                              onClick: {
                                action: {
                                  function: "submitTasks",
                                  parameters: [
                                    {
                                      key: "tasks",
                                      value: "{formInput.tasks}",
                                    },
                                  ],
                                },
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        };
      } else if (
        body?.type === 'CARD_CLICKED' &&
        body?.action?.function === 'submitTasks'
      ) {
        const taskText =
          body?.action?.parameters?.find((p) => p.key === 'tasks')?.value || '';
        const tasks = taskText
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);

        this.wl.log(`[INFO] Submitting tasks for ${userEmail}: ${tasks.join(', ')}`);

        await this.pool.query(
          'SELECT * FROM chatbot.add_tasks($1, $2::TEXT[])',
          [userEmail, tasks],
        );

        reply = { text: `✅ Added ${tasks.length} task(s): ${tasks.join(', ')}` };
      } else if (text.includes('update task')) {
        this.wl.log(`[INFO] Update tasks requested by ${userEmail}`);

        const result = await this.pool.query(
          `SELECT id, description FROM tasks 
           WHERE (user_id = (SELECT uid FROM users WHERE email = $1)
           AND status = 'In Progress') OR date = CURRENT_DATE`,
          [userEmail],
        );

        if (result.rows.length === 0) {
          reply = { text: '🎉 No in-progress tasks for today!' };
        } else {
          const checkboxes = result.rows.map((task: any) => ({
            selectionInput: {
              name: 'completedTasks',
              label: 'Select tasks to mark complete',
              type: 'CHECK_BOX',
              items: [
                {
                  text: task.description,
                  value: String(task.id),
                },
              ],
            },
          }));

          reply = {
            cardsV2: [
              {
                cardId: 'update_tasks_card',
                card: {
                  header: {
                    title: '✅ Update Tasks',
                    subtitle: 'Select tasks you completed today',
                  },
                  sections: [
                    { widgets: checkboxes },
                    {
                      widgets: [
                        {
                          buttonList: {
                            buttons: [
                              {
                                text: 'Mark Completed',
                                onClick: {
                                  action: {
                                    function: 'markCompleted',
                                  },
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          };
        }
      } else if (
        body?.type === 'CARD_CLICKED' &&
        body?.action?.function === 'markCompleted'
      ) {
        const selected = body?.action?.parameters?.find(
          (p) => p.key === 'completedTasks',
        )?.value;
        if (!selected) {
          reply = { text: '⚠️ No tasks selected.' };
        } else {
          const taskIds = selected.split(',').map((id) => parseInt(id, 10));

          this.wl.log(
            `[INFO] Marking tasks completed for ${userEmail}: ${taskIds.join(',')}`,
          );

          const result = await this.pool.query(
            'SELECT * FROM chatbot.update_tasks($1, $2::INT[])',
            [userEmail, taskIds],
          );

          reply = {
            text: `✅ Marked ${result.rows[0].updated_count} task(s) as completed.`,
          };
        }
      } else if (text.includes('task list')) {
        this.wl.log(`[INFO] Task list requested by ${userEmail}`);

        const result = await this.pool.query(
          `SELECT description, status, date
           FROM tasks
           WHERE user_id = (SELECT uid FROM users WHERE email = $1)
           AND (date = CURRENT_DATE OR status = 'In Progress')
           ORDER BY date DESC`,
          [userEmail],
        );

        if (result.rows.length === 0) {
          reply = { text: '📭 You have no tasks for today or pending ones.' };
        } else {
          const formattedTasks = result.rows
            .map(
              (task) =>
                `• ${task.description} — ${task.status} (${new Date(
                  task.date,
                ).toLocaleDateString()})`,
            )
            .join('\n');

          reply = {
            cardsV2: [
              {
                cardId: 'list_tasks_card',
                card: {
                  header: {
                    title: '📋 Your Tasks',
                    subtitle: 'Today’s and pending tasks',
                  },
                  sections: [
                    {
                      widgets: [
                        {
                          textParagraph: {
                            text: formattedTasks.replace(/\n/g, '<br>'),
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          };
        }
      } else {
        reply = {
          text: 'Hi! Type "Add tasks" or "Update tasks" to manage your daily tasks.',
        };
      }

      // Send the actual reply asynchronously to avoid delay in sync response
      if (spaceName && reply) {
        this.chatService
          .sendGoogleChatMessage(spaceName, reply)
          .catch((e) =>
            this.wl.error(`[ERROR] Failed to send async message: ${e.message}`, e),
          );
      }
    } catch (error) {
      this.errorCommonLogger(req, error);
      // Already sent sync response, no need to respond here.
    }
  }
}
