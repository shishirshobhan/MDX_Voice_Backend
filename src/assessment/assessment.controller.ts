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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/authguard';
@ApiTags('Assessments')
@Controller('assessment')
@UseGuards(FirebaseAuthGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentService.create(createAssessmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assessments' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDetails', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Assessments retrieved successfully' })
  findAll(
    @Query('isActive') isActive?: string,
    @Query('includeDetails') includeDetails?: string,
  ) {
    return this.assessmentService.findAll({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      includeDetails: includeDetails === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single assessment by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'includeDetails', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  findOne(
    @Param('id') id: string,
    @Query('includeDetails') includeDetails?: string,
  ) {
    return this.assessmentService.findOne(id, includeDetails !== 'false');
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get assessment statistics' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  getStatistics(@Param('id') id: string) {
    return this.assessmentService.getStatistics(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an assessment' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
  ) {
    return this.assessmentService.update(id, updateAssessmentDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle assessment active status' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Active status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  toggleActive(@Param('id') id: string) {
    return this.assessmentService.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an assessment' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 204, description: 'Assessment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  remove(@Param('id') id: string) {
    return this.assessmentService.remove(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit answers for an assessment attempt' })
  @ApiParam({ name: 'id', type: 'string', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Answers submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Assessment or user not found' })
  submitAnswers(
    @Param('id') assessmentId: string,
    @Body() submitDto: {
      userId: string;
      attemptId: string;
      answers: Array<{
        questionId: string;
        optionId: string;
      }>;
    },
  ) {
    return this.assessmentService.submitAnswers({
      assessmentId,
      ...submitDto,
    });
  }

  @Get('attempts/:attemptId/results')
  @ApiOperation({ summary: 'Get results for a specific attempt' })
  @ApiParam({ name: 'attemptId', type: 'string' })
  @ApiQuery({ name: 'userId', required: true, type: 'string' })
  @ApiResponse({ status: 200, description: 'Attempt results retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  getAttemptResults(
    @Param('attemptId') attemptId: string,
    @Query('userId') userId: string,
  ) {
    return this.assessmentService.getAttemptResults(attemptId, userId);
  }

  @Get('users/:userId/history')
  @ApiOperation({ summary: 'Get user assessment history' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiQuery({ name: 'assessmentId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'User history retrieved successfully' })
  getUserHistory(
    @Param('userId') userId: string,
    @Query('assessmentId') assessmentId?: string,
  ) {
    return this.assessmentService.getUserAssessmentHistory(userId, assessmentId);
  }
}
