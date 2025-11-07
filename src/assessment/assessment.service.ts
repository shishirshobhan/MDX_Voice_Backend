import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { Prisma } from '@prisma/client';

// Type for assessment with full nested relations
type AssessmentWithDetails = Prisma.AssessmentGetPayload<{
  include: {
    sections: {
      include: {
        questions: {
          include: {
            options: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new assessment with sections, questions, and options
   */
  async create(createAssessmentDto: CreateAssessmentDto): Promise<AssessmentWithDetails> {
    try {
      const assessment = await this.prisma.assessment.create({
        data: {
          title: createAssessmentDto.title,
          description: createAssessmentDto.description,
          isActive: createAssessmentDto.isActive ?? true,
          sections: {
            create: createAssessmentDto.sections.map((section) => ({
              name: section.name,
              description: section.description,
              order: section.order ?? 0,
              questions: {
                create: section.questions.map((question) => ({
                  question: question.question,
                  explanation: question.explanation,
                  order: question.order ?? 0,
                  points: question.points ?? 1,
                  options: {
                    create: question.options.map((option) => ({
                      text: option.text,
                      isCorrect: option.isCorrect,
                      order: option.order ?? 0,
                    })),
                  },
                })),
              },
            })),
          },
        },
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  options: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      return assessment;
    } catch (error) {
      throw new BadRequestException('Failed to create assessment: ' + error.message);
    }
  }

  /**
   * Get all assessments with optional filtering
   */
  async findAll(params?: { 
    isActive?: boolean;
    includeDetails?: boolean;
  }) {
    const where: Prisma.AssessmentWhereInput = {};
    
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.includeDetails) {
      return this.prisma.assessment.findMany({
        where,
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  options: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.assessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single assessment by ID
   */
  async findOne(id: string, includeDetails = true): Promise<AssessmentWithDetails> {
    if (includeDetails) {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id },
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  options: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!assessment) {
        throw new NotFoundException(`Assessment with ID ${id} not found`);
      }

      return assessment;
    }

    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  /**
   * Update an assessment
   * Note: This is a simplified update. For complex nested updates, consider separate endpoints
   */
  async update(id: string, updateData: Partial<CreateAssessmentDto>): Promise<AssessmentWithDetails> {
    // First check if assessment exists
    await this.prisma.assessment.findUniqueOrThrow({
      where: { id },
    });

    const data: Prisma.AssessmentUpdateInput = {};
    
    if (updateData.title) data.title = updateData.title;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;

    return this.prisma.assessment.update({
      where: { id },
      data,
      include: {
        sections: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Delete an assessment (cascades to sections, questions, options)
   */
  async remove(id: string) {
    // Check if assessment exists
    await this.prisma.assessment.findUniqueOrThrow({
      where: { id },
    });

    return this.prisma.assessment.delete({
      where: { id },
    });
  }

  /**
   * Toggle assessment active status
   */
  async toggleActive(id: string): Promise<AssessmentWithDetails> {
    const assessment = await this.prisma.assessment.findUniqueOrThrow({
      where: { id },
    });
    
    return this.prisma.assessment.update({
      where: { id },
      data: { isActive: !assessment.isActive },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Get assessment statistics
   */
  async getStatistics(id: string) {
    const assessment = await this.findOne(id, true);

    const totalSections = assessment.sections.length;
    const totalQuestions = assessment.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );
    const totalPoints = assessment.sections.reduce(
      (sum, section) => sum + section.questions.reduce(
        (qSum, question) => qSum + question.points,
        0
      ),
      0
    );

    // Get total attempts (unique attemptIds)
    const answers = await this.prisma.mCQAnswer.findMany({
      where: {
        question: {
          section: {
            assessmentId: id,
          },
        },
      },
      select: {
        attemptId: true,
      },
      distinct: ['attemptId'],
    });

    return {
      assessmentId: id,
      title: assessment.title,
      totalSections,
      totalQuestions,
      totalPoints,
      totalAttempts: answers.length,
      isActive: assessment.isActive,
    };
  }

  /**
   * Submit answers for an assessment attempt
   */
  /**
 * Submit answers for an assessment attempt (without saving to database)
 */
async submitAnswers(params: {
  assessmentId: string;
  userId: string;
  attemptId: string;
  answers: Array<{
    questionId: string;
    optionId: string;
  }>;
}) {
  const { assessmentId, userId, attemptId, answers } = params;

  // Validate that answers is an array
  if (!Array.isArray(answers)) {
    throw new BadRequestException(
      'Answers must be an array. Received: ' + typeof answers
    );
  }

  if (answers.length === 0) {
    throw new BadRequestException('Answers array cannot be empty');
  }

  // Verify assessment exists
  const assessment = await this.findOne(assessmentId, true);
  
  // Check answers and calculate score without saving
  const checkedAnswers = await Promise.all(
    answers.map(async (answer) => {
      const option = await this.prisma.mCQOption.findUnique({
        where: { id: answer.optionId },
        include: { 
          question: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!option) {
        throw new BadRequestException(`Option ${answer.optionId} not found`);
      }

      if (option.questionId !== answer.questionId) {
        throw new BadRequestException(
          `Option ${answer.optionId} does not belong to question ${answer.questionId}`
        );
      }

      // Find the correct option for this question
      const correctOption = option.question.options.find(opt => opt.isCorrect);

      return {
        questionId: answer.questionId,
        questionText: option.question.question,
        selectedOptionId: answer.optionId,
        selectedOptionText: option.text,
        isCorrect: option.isCorrect,
        correctOptionId: correctOption?.id,
        correctOptionText: correctOption?.text,
        points: option.isCorrect ? option.question.points : 0,
        explanation: option.question.explanation,
      };
    })
  );

  // Calculate score
  const correctAnswers = checkedAnswers.filter(a => a.isCorrect).length;
  const totalQuestions = checkedAnswers.length;
  const totalPoints = checkedAnswers.reduce((sum, a) => sum + a.points, 0);
  const maxPoints = assessment.sections.reduce(
    (sum, section) => sum + section.questions.reduce(
      (qSum, question) => qSum + question.points,
      0
    ),
    0
  );
  const scorePercentage = (correctAnswers / totalQuestions) * 100;

  return {
    attemptId,
    assessmentId,
    assessmentTitle: assessment.title,
    userId,
    totalQuestions,
    correctAnswers,
    incorrectAnswers: totalQuestions - correctAnswers,
    totalPoints,
    maxPoints,
    scorePercentage: Math.round(scorePercentage * 100) / 100,
    submittedAt: new Date(),
    answers: checkedAnswers,
  };
}

  /**
   * Get user's attempt results
   */
  async getAttemptResults(attemptId: string, userId: string) {
    const answers = await this.prisma.mCQAnswer.findMany({
      where: {
        attemptId,
        userId,
      },
      include: {
        question: {
          include: {
            options: true,
            section: {
              include: {
                assessment: true,
              },
            },
          },
        },
      },
    });

    if (answers.length === 0) {
      throw new NotFoundException(`No answers found for attempt ${attemptId}`);
    }

    const assessment = answers[0].question.section.assessment;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalQuestions = answers.length;
    const score = (correctAnswers / totalQuestions) * 100;

    return {
      attemptId,
      assessment: {
        id: assessment.id,
        title: assessment.title,
      },
      userId,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      score: Math.round(score * 100) / 100,
      answers: answers.map(answer => ({
        questionId: answer.questionId,
        questionText: answer.question.question,
        selectedOptionId: answer.optionId,
        isCorrect: answer.isCorrect,
        correctOption: answer.question.options.find(o => o.isCorrect),
        explanation: answer.question.explanation,
      })),
    };
  }

  /**
   * Get user's assessment history
   */
  async getUserAssessmentHistory(userId: string, assessmentId?: string) {
    const where: Prisma.MCQAnswerWhereInput = { userId };
    
    if (assessmentId) {
      where.question = {
        section: {
          assessmentId,
        },
      };
    }

    const answers = await this.prisma.mCQAnswer.findMany({
      where,
      include: {
        question: {
          include: {
            section: {
              include: {
                assessment: true,
              },
            },
          },
        },
      },
      orderBy: { answeredAt: 'desc' },
    });

    // Group by attemptId
    const attemptMap = new Map();
    
    answers.forEach(answer => {
      if (!attemptMap.has(answer.attemptId)) {
        attemptMap.set(answer.attemptId, {
          attemptId: answer.attemptId,
          assessment: answer.question.section.assessment,
          answers: [],
          attemptedAt: answer.answeredAt,
        });
      }
      attemptMap.get(answer.attemptId).answers.push(answer);
    });

    return Array.from(attemptMap.values()).map(attempt => {
      const correct = attempt.answers.filter((a: any) => a.isCorrect).length;
      const total = attempt.answers.length;
      
      return {
        attemptId: attempt.attemptId,
        assessmentId: attempt.assessment.id,
        assessmentTitle: attempt.assessment.title,
        attemptedAt: attempt.attemptedAt,
        totalQuestions: total,
        correctAnswers: correct,
        score: Math.round((correct / total) * 100 * 100) / 100,
      };
    });
  }
}
