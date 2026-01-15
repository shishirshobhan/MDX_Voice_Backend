import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssessmentDto, SubmitAssessmentAnswersDto } from './dto/create-assessment.dto';
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
    riskLevels: true;
  };
}>;

interface RiskLevel {
  minScore: number;
  maxScore: number;
  level: string;
  message: string;
  resources: string[];
}

interface AssessmentResult {
  assessmentId: string;
  assessmentTitle: string;
  totalQuestions: number;
  answeredQuestions: number;
  totalScore: number;
  maxPossibleScore: number;
  riskLevel: {
    level: string;
    message: string;
    resources: string[];
  };
  sectionBreakdown: Array<{
    sectionName: string;
    score: number;
    maxScore: number;
    questionCount: number;
  }>;
  detailedAnswers: Array<{
    questionId: string;
    questionText: string;
    selectedOption: string;
    pointsScored: number;
    sectionName: string;
  }>;
  submittedAt: Date;
}

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new assessment with sections, questions, options, and risk levels
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
                  explanation: question.additionalInfo,
                  order: question.order ?? 0,
                  points: 0, // Not used in this scoring system
                  options: {
                    create: question.options.map((option) => ({
                      text: option.text,
                      isCorrect: false, // Not used in point-based system
                      order: option.order ?? 0,
                      pointValue: option.pointValue,
                    })),
                  },
                })),
              },
            })),
          },
          riskLevels: {
            create: createAssessmentDto.riskLevels.map((level, index) => ({
              minScore: level.minScore,
              maxScore: level.maxScore,
              level: level.level,
              message: level.message,
              resources: level.resources,
              order: index,
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
          riskLevels: {
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
          riskLevels: {
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
        riskLevels: {
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
   */
  async update(id: string, updateData: any): Promise<AssessmentWithDetails> {
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
        riskLevels: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Delete an assessment
   */
  async remove(id: string) {
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
        riskLevels: {
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

    // Calculate max possible score
    let maxScore = 0;
    assessment.sections.forEach(section => {
      section.questions.forEach(question => {
        const maxOptionScore = Math.max(...question.options.map(opt => (opt as any).pointValue || 0));
        maxScore += maxOptionScore;
      });
    });

    return {
      assessmentId: id,
      title: assessment.title,
      totalSections,
      totalQuestions,
      maxPossibleScore: maxScore,
      isActive: assessment.isActive,
      riskLevels: assessment.riskLevels,
    };
  }

  /**
   * Submit answers and calculate results (without storing)
   */
  async submitAnswers(
    assessmentId: string,
    submitDto: SubmitAssessmentAnswersDto
  ): Promise<AssessmentResult> {
    // Validate answers array
    if (!Array.isArray(submitDto.answers) || submitDto.answers.length === 0) {
      throw new BadRequestException('Answers array is required and cannot be empty');
    }

    // Get assessment with all details
    const assessment = await this.findOne(assessmentId, true);

    if (!assessment.isActive) {
      throw new BadRequestException('This assessment is not currently active');
    }

    // Extract risk levels
    const riskLevels = assessment.riskLevels;

    if (riskLevels.length === 0) {
      throw new BadRequestException('Assessment does not have risk levels configured');
    }

    // Create a map of all questions for quick lookup
    const questionMap = new Map();
    const sectionMap = new Map();
    
    assessment.sections.forEach(section => {
      section.questions.forEach(question => {
        questionMap.set(question.id, {
          question,
          section: section.name,
        });
        
        if (!sectionMap.has(section.name)) {
          sectionMap.set(section.name, {
            name: section.name,
            score: 0,
            maxScore: 0,
            questionCount: 0,
          });
        }
      });
    });

    // Process each answer
    let totalScore = 0;
    const detailedAnswers: Array<{
      questionId: string;
      questionText: string;
      selectedOption: string;
      pointsScored: number;
      sectionName: string;
    }> = [];
    const answeredQuestions = new Set();

    for (const answer of submitDto.answers) {
      const questionData = questionMap.get(answer.questionId);
      
      if (!questionData) {
        throw new BadRequestException(
          `Question with ID ${answer.questionId} not found in this assessment`
        );
      }

      const selectedOption = questionData.question.options.find(
        opt => opt.id === answer.optionId
      );

      if (!selectedOption) {
        throw new BadRequestException(
          `Option with ID ${answer.optionId} not found for question ${answer.questionId}`
        );
      }

      const pointsScored = (selectedOption as any).pointValue || 0;
      totalScore += pointsScored;
      answeredQuestions.add(answer.questionId);

      // Update section breakdown
      const sectionStats = sectionMap.get(questionData.section);
      sectionStats.score += pointsScored;
      sectionStats.questionCount += 1;

      // Add to detailed answers
      detailedAnswers.push({
        questionId: questionData.question.id,
        questionText: questionData.question.question,
        selectedOption: selectedOption.text,
        pointsScored,
        sectionName: questionData.section,
      });
    }

    // Calculate max possible score for answered questions
    let maxPossibleScore = 0;
    assessment.sections.forEach(section => {
      section.questions.forEach(question => {
        if (answeredQuestions.has(question.id)) {
          const maxOptionScore = Math.max(
            ...question.options.map(opt => (opt as any).pointValue || 0)
          );
          maxPossibleScore += maxOptionScore;
          
          const sectionStats = sectionMap.get(section.name);
          sectionStats.maxScore += maxOptionScore;
        }
      });
    });

    // Determine risk level based on total score
    const riskLevel = this.determineRiskLevel(totalScore, riskLevels);

    return {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      totalQuestions: questionMap.size,
      answeredQuestions: answeredQuestions.size,
      totalScore,
      maxPossibleScore,
      riskLevel,
      sectionBreakdown: Array.from(sectionMap.values()),
      detailedAnswers,
      submittedAt: new Date(),
    };
  }

  /**
   * Determine risk level based on score
   */
  private determineRiskLevel(score: number, riskLevels: any[]) {
    // Sort risk levels by minScore to ensure correct matching
    const sortedLevels = [...riskLevels].sort((a, b) => a.minScore - b.minScore);

    for (const level of sortedLevels) {
      if (score >= level.minScore && score <= level.maxScore) {
        return {
          level: level.level,
          message: level.message,
          resources: level.resources,
        };
      }
    }

    // If no match found, return the highest risk level as default
    const highestLevel = sortedLevels[sortedLevels.length - 1];
    return {
      level: highestLevel.level,
      message: highestLevel.message,
      resources: highestLevel.resources,
    };
  }

  /**
   * Get assessment for user (without showing point values)
   */
  async getAssessmentForUser(id: string) {
    const assessment = await this.findOne(id, true);

    if (!assessment.isActive) {
      throw new BadRequestException('This assessment is not currently active');
    }

    // Remove point values from options for users
    const sanitizedAssessment = {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      sections: assessment.sections.map(section => ({
        id: section.id,
        name: section.name,
        description: section.description,
        order: section.order,
        questions: section.questions.map(question => ({
          id: question.id,
          question: question.question,
          order: question.order,
          options: question.options.map(option => ({
            id: option.id,
            text: option.text,
            order: option.order,
            // pointValue is intentionally excluded
          })),
        })),
      })),
    };

    return sanitizedAssessment;
  }
}
