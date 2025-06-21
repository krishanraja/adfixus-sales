
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';

interface Question {
  id: string;
  category: 'durability' | 'cross-domain' | 'privacy' | 'browser' | 'sales-mix';
  question: string;
  type: 'radio' | 'slider';
  options?: { value: string; label: string; score: number }[];
  sliders?: { key: string; label: string; defaultValue: number }[];
}

const questions: Question[] = [
  {
    id: 'first-party-data',
    category: 'durability',
    type: 'radio',
    question: 'What percentage of your users are actively logged in (not just authenticated)?',
    options: [
      { value: 'high', label: '60%+ of users are logged in', score: 4 },
      { value: 'medium', label: '30-60% of users are logged in', score: 3 },
      { value: 'low', label: '10-30% of users are logged in', score: 2 },
      { value: 'very-low', label: 'Less than 10% are logged in', score: 1 }
    ]
  },
  {
    id: 'identity-resolution',
    category: 'cross-domain',
    type: 'radio',
    question: 'Do you have identity resolution across multiple domains/subdomains?',
    options: [
      { value: 'full', label: 'Yes, comprehensive cross-domain tracking', score: 4 },
      { value: 'partial', label: 'Limited cross-domain capabilities', score: 2 },
      { value: 'none', label: 'No cross-domain identity resolution', score: 1 }
    ]
  },
  {
    id: 'privacy-compliance',
    category: 'privacy',
    type: 'radio',
    question: 'How do you handle privacy consent and compliance?',
    options: [
      { value: 'comprehensive', label: 'GDPR/CCPA compliant with consent management', score: 4 },
      { value: 'basic', label: 'Basic privacy compliance in place', score: 3 },
      { value: 'minimal', label: 'Minimal privacy measures', score: 1 }
    ]
  },
  {
    id: 'safari-strategy',
    category: 'browser',
    type: 'radio',
    question: 'How do you monetize Safari/Firefox traffic?',
    options: [
      { value: 'optimized', label: 'We have Safari/Firefox-specific optimization', score: 4 },
      { value: 'basic', label: 'Basic contextual targeting for Safari/Firefox', score: 2 },
      { value: 'struggling', label: 'Safari/Firefox traffic is poorly monetized', score: 1 }
    ]
  },
  {
    id: 'cookie-dependence',
    category: 'durability',
    type: 'radio',
    question: 'How dependent is your current setup on third-party cookies?',
    options: [
      { value: 'low', label: 'Minimal dependence on 3P cookies', score: 4 },
      { value: 'medium', label: 'Moderate dependence on 3P cookies', score: 2 },
      { value: 'high', label: 'Heavily dependent on 3P cookies', score: 1 }
    ]
  },
  {
    id: 'sales-mix',
    category: 'sales-mix',
    type: 'slider',
    question: 'Provide a rough makeup of your ad sales?',
    sliders: [
      { key: 'direct', label: 'Direct', defaultValue: 33 },
      { key: 'dealIds', label: 'Deal IDs', defaultValue: 33 },
      { key: 'openExchange', label: 'Open Exchange', defaultValue: 34 }
    ]
  },
  {
    id: 'frequency-capping',
    category: 'cross-domain',
    type: 'radio',
    question: 'Can you effectively manage frequency capping across your properties?',
    options: [
      { value: 'excellent', label: 'Comprehensive frequency management', score: 4 },
      { value: 'good', label: 'Basic frequency capping in place', score: 3 },
      { value: 'limited', label: 'Limited frequency control', score: 2 },
      { value: 'none', label: 'No effective frequency capping', score: 1 }
    ]
  },
  {
    id: 'data-activation',
    category: 'privacy',
    type: 'radio',
    question: 'What level of segmentation do you currently have?',
    options: [
      { value: 'advanced', label: 'Advanced: i.e 20+ segments, a combination of contextual, behavioural and demographic', score: 4 },
      { value: 'moderate', label: 'Moderate: i.e demographics and contextual only', score: 3 },
      { value: 'limited', label: 'Limited: i.e Demographics only', score: 2 },
      { value: 'minimal', label: 'Minimal: No first-party data use', score: 0 }
    ]
  }
];

interface IdentityHealthQuizProps {
  onComplete: (results: any) => void;
}

export const IdentityHealthQuiz: React.FC<IdentityHealthQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleAnswerChange = (questionId: string, value: string | Record<string, number>) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSliderChange = (questionId: string, key: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [key]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate results
      const results = calculateResults(answers);
      onComplete(results);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = (answers: Record<string, any>) => {
    const categories = {
      durability: { total: 0, count: 0 },
      'cross-domain': { total: 0, count: 0 },
      privacy: { total: 0, count: 0 },
      browser: { total: 0, count: 0 },
      'sales-mix': { total: 0, count: 0 }
    };

    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        if (question.type === 'radio' && question.options) {
          const option = question.options.find(opt => opt.value === answer);
          if (option) {
            categories[question.category].total += option.score;
            categories[question.category].count += 1;
          }
        } else if (question.type === 'slider') {
          // For sales mix, we'll assign a neutral score
          categories[question.category].total += 3;
          categories[question.category].count += 1;
        }
      }
    });

    const scores = Object.entries(categories).reduce((acc, [category, data]) => {
      if (category === 'sales-mix') {
        // Special handling for sales mix
        acc[category] = { 
          score: 3, 
          grade: 'B', 
          total: data.total, 
          count: data.count,
          breakdown: answers['sales-mix'] || { direct: 33, dealIds: 33, openExchange: 34 }
        };
      } else {
        const avgScore = data.count > 0 ? data.total / data.count : 0;
        const grade = getGrade(avgScore);
        acc[category] = { score: avgScore, grade, total: data.total, count: data.count };
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate overall score excluding sales-mix
    const scoringCategories = Object.entries(categories).filter(([cat]) => cat !== 'sales-mix');
    const overallScore = scoringCategories.reduce((sum, [, cat]) => sum + cat.total, 0) / 
                       scoringCategories.reduce((sum, [, cat]) => sum + cat.count, 0);
    
    return {
      scores,
      overallScore,
      overallGrade: getGrade(overallScore),
      answers
    };
  };

  const getGrade = (score: number): string => {
    if (score >= 3.5) return 'A+';
    if (score >= 3.0) return 'A';
    if (score >= 2.5) return 'B';
    if (score >= 2.0) return 'C';
    if (score >= 1.5) return 'D';
    return 'F';
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];
  const currentAnswer = answers[question.id];

  const isAnswered = () => {
    if (question.type === 'radio') {
      return !!currentAnswer;
    } else if (question.type === 'slider') {
      return currentAnswer && Object.keys(currentAnswer).length === (question.sliders?.length || 0);
    }
    return false;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900">Identity Health Assessment</h2>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{question.question}</CardTitle>
        </CardHeader>
        <CardContent>
          {question.type === 'radio' && question.options && (
            <RadioGroup 
              value={currentAnswer || ''} 
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              className="space-y-4"
            >
              {question.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === 'slider' && question.sliders && (
            <div className="space-y-6">
              {question.sliders.map((slider) => (
                <div key={slider.key}>
                  <div className="flex justify-between items-center mb-2">
                    <Label>{slider.label}</Label>
                    <span className="text-sm font-medium">
                      {currentAnswer?.[slider.key] || slider.defaultValue}%
                    </span>
                  </div>
                  <Slider
                    value={[currentAnswer?.[slider.key] || slider.defaultValue]}
                    onValueChange={([value]) => handleSliderChange(question.id, slider.key, value)}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
              ))}
              <div className="text-sm text-gray-500 mt-4">
                Total: {Object.values(currentAnswer || {}).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)}%
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!isAnswered()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentQuestion === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
