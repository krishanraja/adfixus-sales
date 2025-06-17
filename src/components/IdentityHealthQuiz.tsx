import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Question {
  id: string;
  category: 'durability' | 'cross-domain' | 'privacy' | 'browser';
  question: string;
  tooltip: string;
  options: { value: string; label: string; score: number }[];
}

const questions: Question[] = [
  {
    id: 'first-party-data',
    category: 'durability',
    question: 'What percentage of your users are authenticated/logged in?',
    tooltip: 'Authenticated users provide first-party data, which is more durable and privacy-compliant than third-party cookies.',
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
    question: 'Do you have identity resolution across multiple domains/subdomains?',
    tooltip: 'Cross-domain identity resolution allows you to recognize the same user across different properties, increasing addressability.',
    options: [
      { value: 'full', label: 'Yes, comprehensive cross-domain tracking', score: 4 },
      { value: 'partial', label: 'Limited cross-domain capabilities', score: 2 },
      { value: 'none', label: 'No cross-domain identity resolution', score: 1 }
    ]
  },
  {
    id: 'privacy-compliance',
    category: 'privacy',
    question: 'How do you handle privacy consent and compliance?',
    tooltip: 'Strong privacy compliance ensures sustainable revenue as regulations tighten globally.',
    options: [
      { value: 'comprehensive', label: 'GDPR/CCPA compliant with consent management', score: 4 },
      { value: 'basic', label: 'Basic privacy compliance in place', score: 3 },
      { value: 'minimal', label: 'Minimal privacy measures', score: 1 }
    ]
  },
  {
    id: 'safari-strategy',
    category: 'browser',
    question: 'How do you monetize Safari traffic (35% of web traffic)?',
    tooltip: 'Safari blocks third-party cookies by default, making it difficult to monetize without proper identity solutions.',
    options: [
      { value: 'optimized', label: 'We have Safari-specific optimization', score: 4 },
      { value: 'basic', label: 'Basic contextual targeting for Safari', score: 2 },
      { value: 'struggling', label: 'Safari traffic is poorly monetized', score: 1 }
    ]
  },
  {
    id: 'cookie-dependence',
    category: 'durability',
    question: 'How dependent is your current setup on third-party cookies?',
    tooltip: 'Third-party cookies are being phased out. Heavy dependence indicates vulnerability to future changes.',
    options: [
      { value: 'low', label: 'Minimal dependence on 3P cookies', score: 4 },
      { value: 'medium', label: 'Moderate dependence on 3P cookies', score: 2 },
      { value: 'high', label: 'Heavily dependent on 3P cookies', score: 1 }
    ]
  },
  {
    id: 'match-rates',
    category: 'cross-domain',
    question: 'What are your typical ID match rates with demand partners?',
    tooltip: 'Higher match rates mean more of your inventory is addressable to buyers, leading to higher CPMs.',
    options: [
      { value: 'high', label: '70%+ match rates', score: 4 },
      { value: 'medium', label: '50-70% match rates', score: 3 },
      { value: 'low', label: '30-50% match rates', score: 2 },
      { value: 'very-low', label: 'Below 30% match rates', score: 1 }
    ]
  },
  {
    id: 'frequency-capping',
    category: 'cross-domain',
    question: 'Can you effectively manage frequency capping across your properties?',
    tooltip: 'Effective frequency capping prevents ad fatigue and improves campaign performance, leading to higher advertiser satisfaction.',
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
    question: 'What level of segmentation do you currently have?',
    tooltip: 'First-party data activation allows for better targeting while maintaining privacy compliance.',
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
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
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

  const calculateResults = (answers: Record<string, string>) => {
    const categories = {
      durability: { total: 0, count: 0 },
      'cross-domain': { total: 0, count: 0 },
      privacy: { total: 0, count: 0 },
      browser: { total: 0, count: 0 }
    };

    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options.find(opt => opt.value === answer);
        if (option) {
          categories[question.category].total += option.score;
          categories[question.category].count += 1;
        }
      }
    });

    const scores = Object.entries(categories).reduce((acc, [category, data]) => {
      const avgScore = data.count > 0 ? data.total / data.count : 0;
      const grade = getGrade(avgScore);
      acc[category] = { score: avgScore, grade, total: data.total, count: data.count };
      return acc;
    }, {} as Record<string, any>);

    const overallScore = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0) / 
                       Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);
    
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

  return (
    <TooltipProvider>
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
            <CardTitle className="flex items-center space-x-2">
              <span>{question.question}</span>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{question.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                disabled={!currentAnswer}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentQuestion === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
