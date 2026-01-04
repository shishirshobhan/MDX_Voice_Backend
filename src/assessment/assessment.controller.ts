import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto, UpdateAssessmentDto, SubmitAssessmentAnswersDto } from './dto/create-assessment.dto';
import { UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/authguard';

@ApiTags('Assessments')
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // ============================================
  // ADMIN ENDPOINTS (Protected with Auth Guard)
  // ============================================

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ 
    summary: 'Create a new assessment (Admin only)',
    description: 'Creates an assessment with sections, questions, options with point values, and risk level thresholds'
  })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentService.create(createAssessmentDto);
  }

  @Get('admin/all')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ 
    summary: 'Get all assessments with full details (Admin only)',
    description: 'Retrieves all assessments including point values and scoring logic'
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDetails', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Assessments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('isActive') isActive?: string,
    @Query('includeDetails') includeDetails?: string,
  ) {
    return this.assessmentService.findAll({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      includeDetails: includeDetails === 'true',
    });
  }

  @Get('admin/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ 
    summary: 'Get assessment with full details (Admin only)',
    description: 'Retrieves a single assessment with all details including point values'
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.assessmentService.findOne(id, true);
  }

  @Get(':id/statistics')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ 
    summary: 'Get assessment statistics (Admin only)',
    description: 'Get statistics including total questions, max score, and risk levels'
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatistics(@Param('id') id: string) {
    return this.assessmentService.getStatistics(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ 
    summary: 'Update an assessment (Admin only)',
    description: 'Update basic assessment properties (title, description, active status)'
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
  ) {
    return this.assessmentService.update(id, updateAssessmentDto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ 
    summary: 'Toggle assessment active status (Admin only)',
    description: 'Enable or disable an assessment for user access'
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Active status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  toggleActive(@Param('id') id: string) {
    return this.assessmentService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete an assessment (Admin only)',
    description: 'Permanently delete an assessment and all related data'
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 204, description: 'Assessment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.assessmentService.remove(id);
  }

  // ============================================
  // USER ENDPOINTS (Public or with minimal auth)
  // ============================================

  @Get('user/:id')
  @ApiOperation({ 
    summary: 'Get assessment for users (Public)',
    description: 'Retrieves assessment without showing point values or scoring logic'
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 400, description: 'Assessment is not active' })
  getAssessmentForUser(@Param('id') id: string) {
    return this.assessmentService.getAssessmentForUser(id);
  }

  @Get('user/list/active')
  @ApiOperation({ 
    summary: 'Get list of active assessments (Public)',
    description: 'Returns a list of all currently active assessments without detailed questions'
  })
  @ApiResponse({ status: 200, description: 'Active assessments retrieved successfully' })
  getActiveAssessments() {
    return this.assessmentService.findAll({
      isActive: true,
      includeDetails: false,
    });
  }

  @Post(':id/submit')
  @ApiOperation({ 
    summary: 'Submit assessment answers and get results (Public)',
    description: 'Submit user answers and receive immediate scored results with risk assessment. Results are NOT stored.'
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Assessment ID' })
  @ApiBody({ type: SubmitAssessmentAnswersDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Assessment scored successfully',
    schema: {
      example: {
        assessmentId: 'clx123',
        assessmentTitle: 'Domestic Violence Awareness Assessment',
        totalQuestions: 25,
        answeredQuestions: 25,
        totalScore: 42,
        maxPossibleScore: 100,
        riskLevel: {
          level: 'High Risk',
          message: 'Your responses suggest you may be in an abusive relationship...',
          resources: ['Emergency contacts', 'Safety planning', 'Shelter information']
        },
        sectionBreakdown: [
          {
            sectionName: 'Physical Safety',
            score: 8,
            maxScore: 16,
            questionCount: 4
          }
        ],
        detailedAnswers: [
          {
            questionId: 'q1',
            questionText: 'Does your partner ever physically hurt you?',
            selectedOption: 'Sometimes',
            pointsScored: 2,
            sectionName: 'Physical Safety'
          }
        ],
        submittedAt: '2025-12-14T10:30:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid answers or assessment inactive' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  submitAnswers(
    @Param('id') assessmentId: string,
    @Body() submitDto: SubmitAssessmentAnswersDto,
  ): any {
    return this.assessmentService.submitAnswers(assessmentId, submitDto);
  }
}
