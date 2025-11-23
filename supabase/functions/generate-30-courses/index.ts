import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Starting to generate 30 courses...');

    // Define 30 diverse course topics
    const courseTopics = [
      { title: 'HTML Fundamentals', category: 'web2', difficulty: 'beginner', modules: 8, icon: '🌐' },
      { title: 'CSS Mastery', category: 'web2', difficulty: 'beginner', modules: 10, icon: '🎨' },
      { title: 'JavaScript Basics', category: 'web2', difficulty: 'beginner', modules: 12, icon: '⚡' },
      { title: 'React for Beginners', category: 'web2', difficulty: 'intermediate', modules: 10, icon: '⚛️' },
      { title: 'Node.js Backend', category: 'web2', difficulty: 'intermediate', modules: 10, icon: '🟢' },
      { title: 'API Development', category: 'web2', difficulty: 'intermediate', modules: 8, icon: '🔌' },
      { title: 'Database Design', category: 'tech', difficulty: 'intermediate', modules: 9, icon: '💾' },
      { title: 'NFT Art Creation', category: 'web3-nontech', difficulty: 'beginner', modules: 7, icon: '🖼️' },
      { title: 'Community Building Web3', category: 'web3-nontech', difficulty: 'beginner', modules: 8, icon: '👥' },
      { title: 'Crypto Trading Basics', category: 'web3-nontech', difficulty: 'beginner', modules: 10, icon: '📈' },
      { title: 'DAO Participation', category: 'web3-nontech', difficulty: 'beginner', modules: 6, icon: '🏛️' },
      { title: 'Web3 Marketing', category: 'web3-nontech', difficulty: 'intermediate', modules: 8, icon: '📣' },
      { title: 'Critical Thinking', category: 'philosophy', difficulty: 'beginner', modules: 8, icon: '🤔' },
      { title: 'Ethics in Technology', category: 'philosophy', difficulty: 'intermediate', modules: 9, icon: '⚖️' },
      { title: 'Logic and Reasoning', category: 'philosophy', difficulty: 'beginner', modules: 7, icon: '🧠' },
      { title: 'Philosophy of Mind', category: 'philosophy', difficulty: 'intermediate', modules: 10, icon: '💭' },
      { title: 'Existentialism 101', category: 'philosophy', difficulty: 'beginner', modules: 6, icon: '🌟' },
      { title: 'AI Fundamentals', category: 'tech', difficulty: 'beginner', modules: 10, icon: '🤖' },
      { title: 'Machine Learning Basics', category: 'tech', difficulty: 'intermediate', modules: 12, icon: '📊' },
      { title: 'Cybersecurity Essentials', category: 'tech', difficulty: 'intermediate', modules: 10, icon: '🔒' },
      { title: 'Cloud Computing', category: 'tech', difficulty: 'intermediate', modules: 9, icon: '☁️' },
      { title: 'DevOps Practices', category: 'tech', difficulty: 'advanced', modules: 11, icon: '🔄' },
      { title: 'Mobile App Development', category: 'web2', difficulty: 'intermediate', modules: 10, icon: '📱' },
      { title: 'TypeScript Deep Dive', category: 'web2', difficulty: 'intermediate', modules: 9, icon: '📘' },
      { title: 'Git Version Control', category: 'tech', difficulty: 'beginner', modules: 6, icon: '🔀' },
      { title: 'Data Structures', category: 'tech', difficulty: 'intermediate', modules: 12, icon: '📚' },
      { title: 'Algorithms Explained', category: 'tech', difficulty: 'intermediate', modules: 11, icon: '🧮' },
      { title: 'Web3 Gaming', category: 'web3-nontech', difficulty: 'intermediate', modules: 9, icon: '🎮' },
      { title: 'Metaverse Basics', category: 'web3-nontech', difficulty: 'beginner', modules: 7, icon: '🌌' },
      { title: 'Digital Identity Web3', category: 'web3-nontech', difficulty: 'intermediate', modules: 8, icon: '🆔' }
    ];

    const generatedCourses = [];

    // Generate each course
    for (let i = 0; i < courseTopics.length; i++) {
      const topic = courseTopics[i];
      console.log(`Generating course ${i + 1}/30: ${topic.title}`);

      // Generate course description using AI
      const descriptionPrompt = `Create a brief, engaging 1-sentence description for an online course titled "${topic.title}". Make it informative and appealing to learners.`;
      
      const descResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: descriptionPrompt }],
        }),
      });

      if (!descResponse.ok) {
        console.error(`Failed to generate description for ${topic.title}`);
        continue;
      }

      const descData = await descResponse.json();
      const description = descData.choices[0]?.message?.content || `Learn ${topic.title} step by step`;

      // Insert course
      const { data: course, error: courseError } = await supabase
        .from('learning_courses')
        .insert({
          title: topic.title,
          description,
          category: topic.category,
          difficulty_level: topic.difficulty,
          total_modules: topic.modules,
          icon_url: topic.icon,
          is_active: true
        })
        .select()
        .single();

      if (courseError) {
        console.error(`Error inserting course ${topic.title}:`, courseError);
        continue;
      }

      generatedCourses.push(course);

      // Generate modules for this course
      const modulesPrompt = `Generate ${topic.modules} module titles for a course on "${topic.title}". 
Return ONLY a JSON array of titles, like: ["Module 1 Title", "Module 2 Title", ...]
Make titles progressive from basics to advanced. Keep titles short (3-5 words).`;

      const modulesResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: modulesPrompt }],
        }),
      });

      if (!modulesResponse.ok) {
        console.error(`Failed to generate modules for ${topic.title}`);
        continue;
      }

      const modulesData = await modulesResponse.json();
      let moduleTitles: string[];
      
      try {
        const content = modulesData.choices[0]?.message?.content || '[]';
        moduleTitles = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
      } catch (e) {
        console.error('Failed to parse module titles, using defaults');
        moduleTitles = Array.from({ length: topic.modules }, (_, i) => `Module ${i + 1}`);
      }

      // Generate content for each module
      for (let j = 0; j < topic.modules; j++) {
        const moduleTitle = moduleTitles[j] || `Module ${j + 1}`;
        
        const contentPrompt = `Create educational content for: "${moduleTitle}" in the "${topic.title}" course.

Return ONLY a JSON object with this EXACT structure (no markdown, no extra text):
{
  "lesson": "2-3 sentences explaining the concept simply and clearly",
  "quiz": [
    {"question": "Question text?", "options": ["Option A", "Option B", "Option C"], "correct": 0},
    {"question": "Question text?", "options": ["Option A", "Option B", "Option C"], "correct": 1},
    {"question": "Question text?", "options": ["Option A", "Option B", "Option C"], "correct": 2}
  ]
}

Make it educational, accurate, and beginner-friendly. The correct answer index (0, 1, or 2) must match the right option.`;

        const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: contentPrompt }],
          }),
        });

        if (!contentResponse.ok) {
          console.error(`Failed to generate content for module ${j + 1}`);
          continue;
        }

        const contentData = await contentResponse.json();
        let moduleContent;

        try {
          const rawContent = contentData.choices[0]?.message?.content || '{}';
          moduleContent = JSON.parse(rawContent.replace(/```json\n?|\n?```/g, ''));
        } catch (e) {
          console.error('Failed to parse module content, using default');
          moduleContent = {
            lesson: `Learn about ${moduleTitle} in this module.`,
            quiz: [
              { question: 'What is the main topic?', options: ['A', 'B', 'C'], correct: 0 },
              { question: 'Key concept?', options: ['X', 'Y', 'Z'], correct: 1 },
              { question: 'Application?', options: ['P', 'Q', 'R'], correct: 0 }
            ]
          };
        }

        // Insert module
        const { error: moduleError } = await supabase
          .from('learning_modules')
          .insert({
            course_id: course.id,
            module_number: j + 1,
            title: moduleTitle,
            description: `Learn ${moduleTitle.toLowerCase()}`,
            content: moduleContent,
            points_reward: 100,
            is_locked: j > 0
          });

        if (moduleError) {
          console.error(`Error inserting module ${j + 1}:`, moduleError);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`✓ Course ${i + 1}/30 completed: ${topic.title}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated ${generatedCourses.length} courses`,
        courses: generatedCourses.map(c => ({ id: c.id, title: c.title }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating courses:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
