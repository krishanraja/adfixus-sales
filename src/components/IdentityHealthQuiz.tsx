
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface QuizAnswers {
  [key: string]: string | { direct: number; dealIds: number; openExchange: number };
}

interface IdentityHealthQuizProps {
  onComplete: (results: any) => void;
}

export const IdentityHealthQuiz: React.FC<IdentityHealthQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [salesMix, setSalesMix] = useState({ direct: 40, dealIds: 35, openExchange: 25 });

  const questions = [
    {
      id: 'durability-strategy',
      category: 'durability',
      question: 'How do you handle identity resolution when users are actively logged in (not just authenticated)?',
      options: [
        { value: 'no-strategy', label: 'No specific strategy', score: 1 },
        { value: 'basic-auth', label: 'Basic authentication matching', score: 2 },
        { value: 'cross-session', label: 'Cross-session identity linking', score: 3 },
        { value: 'advanced-resolution', label: 'Advanced probabilistic + deterministic resolution', score: 4 }
      ]
    },
    {
      id: 'cross-domain-visibility',
      category: 'cross-domain',
      question: 'What user tracking across domains/subdomains are you able to support?',
      options: [
        { value: 'single-domain', label: 'Single domain only', score: 1 },
        { value: 'limited-cross', label: 'Limited cross-domain capability', score: 2 },
        { value: 'good-cross', label: 'Good cross-domain tracking', score: 3 },
        { value: 'seamless-cross', label: 'Seamless cross-domain identity resolution', score: 4 }
      ]
    },
    {
      id: 'privacy-compliance',
      category: 'privacy',
      question: 'How do you handle privacy compliance and consent management?',
      options: [
        { value: 'basic-compliance', label: 'Basic compliance only', score: 1 },
        { value: 'gdpr-ready', label: 'GDPR/CCPA compliant', score: 2 },
        { value: 'advanced-consent', label: 'Advanced consent management', score: 3 },
        { value: 'privacy-first', label: 'Privacy-first architecture with full compliance', score: 4 }
      ]
    },
    {
      id: 'safari-strategy',
      category: 'browser',
      question: 'How do you monetize Safari/Firefox traffic?',
      options: [
        { value: 'struggling', label: 'Struggling to monetize effectively', score: 1 },
        { value: 'basic-approach', label: 'Basic contextual targeting', score: 2 },
        { value: 'some-success', label: 'Some success with workarounds', score: 3 },
        { value: 'optimized', label: 'Fully optimized for privacy-focused browsers', score: 4 }
      ]
    },
    {
      id: 'sales-mix',
      category: 'sales-mix',
      question: 'Provide a rough makeup of your ad sales',
      type: 'sales-mix'
    }
  ];

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSalesMixChange = (type: 'direct' | 'dealIds' | 'openExchange', value: number[]) => {
    const newValue = value[0];
    const newSalesMix = { ...salesMix, [type]: newValue };
    
    // Calculate total
    const total = Object.values(newSalesMix).reduce((sum, val) => sum + val, 0);
    
    // If total exceeds 100, proportionally adjust other values
    if (total > 100) {
      const excess = total - 100;
      const otherKeys = Object.keys(newSalesMix).filter(key => key !== type) as Array<keyof typeof newSalesMix>;
      
      // Distribute the excess proportionally among other values
      otherKeys.forEach(key => {
        const proportion = newSalesMix[key] / (total - newValue);
        newSalesMix[key] = Math.max(0, newSalesMix[key] - (excess * proportion));
      });
      
      // Round and ensure we don't go negative
      Object.keys(newSalesMix).forEach(key => {
        const typedKey = key as keyof typeof newSalesMix;
        newSalesMix[typedKey] = Math.round(newSalesMix[typedKey]);
      });
    }
    
    setSalesMix(newSalesMix);
  };

  const currentQuestionData = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const totalQuestions = questions.length;

  const canProceed = () => {
    if (currentQuestionData.type === 'sales-mix') {
      const total = salesMix.direct + salesMix.dealIds + salesMix.openExchange;
      return total >= 95 && total <= 100; // Allow small rounding differences
    }
    return answers[currentQuestionData.id] !== undefined;
  };

  const handleNext = () => {
    if (currentQuestionData.type === 'sales-mix') {
      setAnswers(prev => ({ ...prev, [currentQuestionData.id]: salesMix }));
    }
    
    if (isLastQuestion) {
      calculateResults();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const calculateResults = () => {
    const finalAnswers = { ...answers };
    if (currentQuestionData.type === 'sales-mix') {
      finalAnswers[currentQuestionData.id] = salesMix;
    }

    const scores: { [key: string]: any } = {};
    let totalScore = 0;
    let questionCount = 0;

    // Calculate scores for each category
    questions.forEach(q => {
      if (q.type === 'sales-mix') {
        scores[q.category] = {
          score: 4, // Sales mix doesn't affect scoring
          grade: 'N/A',
          breakdown: finalAnswers[q.id] as { direct: number; dealIds: number; openExchange: number }
        };
      } else {
        const answer = finalAnswers[q.id] as string;
        const option = q.options?.find(opt => opt.value === answer);
        const score = option?.score || 0;
        
        scores[q.category] = {
          score,
          grade: getGrade(score)
        };
        
        totalScore += score;
        questionCount++;
      }
    });

    const overallScore = totalScore / questionCount;
    const overallGrade = getGrade(overallScore);

    const results = {
      answers: finalAnswers,
      scores,
      overallScore,
      overallGrade,
      timestamp: new Date().toISOString()
    };

    onComplete(results);
  };

  const getGrade = (score: number): string => {
    if (score >= 3.8) return 'A+';
    if (score >= 3.5) return 'A';
    if (score >= 3.0) return 'B';
    if (score >= 2.5) return 'C';
    if (score >= 2.0) return 'D';
    return 'F';
  };

  const renderSalesMixQuestion = () => {
    const total = salesMix.direct + salesMix.dealIds + salesMix.openExchange;
    const isValidTotal = total >= 95 && total <= 100;

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Direct Sales: {salesMix.direct}%</Label>
            </div>
            <Slider
              value={[salesMix.direct]}
              onValueChange={(value) => handleSalesMixChange('direct', value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Deal IDs: {salesMix.dealIds}%</Label>
            </div>
            <Slider
              value={[salesMix.dealIds]}
              onValueChange={(value) => handleSalesMixChange('dealIds', value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Open Exchange: {salesMix.openExchange}%</Label>
            </div>
            <Slider
              value={[salesMix.openExchange]}
              onValueChange={(value) => handleSalesMixChange('openExchange', value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <div className={`p-3 rounded-lg border ${isValidTotal ? 'bg-muted/30 border-muted' : 'bg-muted/50 border-muted'}`}>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{total}%</span>
              {!isValidTotal && ' (Must equal 100%)'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="fixed top-12 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/30">
        <div className="container mx-auto px-4 py-3">
          <Progress value={(currentQuestion / totalQuestions) * 100} className="h-1" />
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {currentQuestionData.question}
          </h2>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {totalQuestions}
          </p>
        </div>

        <div className="space-y-6">
          {currentQuestionData.type === 'sales-mix' ? (
            renderSalesMixQuestion()
          ) : (
            <div className="space-y-3">
              {currentQuestionData.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentQuestionData.id, option.value)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    answers[currentQuestionData.id] === option.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50 text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-8">
            <Button
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
              variant="outline"
              size="lg"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
            >
              {isLastQuestion ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
