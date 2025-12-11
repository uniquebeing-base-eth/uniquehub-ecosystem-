import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Plus, Trash2, Video, GripVertical, ChevronDown, ChevronUp, 
  Loader2, Shield, AlertTriangle, CheckCircle, Eye 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Lesson {
  id?: string;
  title: string;
  description: string;
  videoFile: File | null;
  videoUrl?: string;
  thumbnailFile: File | null;
  thumbnailUrl?: string;
  isPreview: boolean;
  moderationStatus: 'pending' | 'approved' | 'needs_review' | 'rejected';
  moderationNotes?: string;
}

interface Module {
  id?: string;
  title: string;
  description: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface CourseModulesEditorProps {
  courseId: string;
  onSave?: () => void;
}

export const CourseModulesEditor = ({ courseId, onSave }: CourseModulesEditorProps) => {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingModule, setSavingModule] = useState<string | null>(null);
  const [moderatingLesson, setModeratingLesson] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchExistingModules();
    }
  }, [courseId]);

  const fetchExistingModules = async () => {
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order');

      if (modulesError) throw modulesError;

      if (modulesData && modulesData.length > 0) {
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (mod) => {
            const { data: lessonsData } = await supabase
              .from('course_lessons')
              .select('*')
              .eq('module_id', mod.id)
              .order('lesson_order');

            return {
              id: mod.id,
              title: mod.title,
              description: mod.description || '',
              isExpanded: true,
              lessons: (lessonsData || []).map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description || '',
                videoFile: null,
                videoUrl: lesson.video_url,
                thumbnailFile: null,
                thumbnailUrl: lesson.thumbnail_url,
                isPreview: lesson.is_preview || false,
                moderationStatus: lesson.moderation_status as any || 'pending',
                moderationNotes: lesson.moderation_notes,
              })),
            };
          })
        );
        setModules(modulesWithLessons);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const addModule = () => {
    setModules([
      ...modules,
      {
        title: `Module ${modules.length + 1}`,
        description: '',
        lessons: [],
        isExpanded: true,
      },
    ]);
  };

  const removeModule = (moduleIndex: number) => {
    setModules(modules.filter((_, i) => i !== moduleIndex));
  };

  const updateModule = (moduleIndex: number, field: string, value: string) => {
    const updated = [...modules];
    updated[moduleIndex] = { ...updated[moduleIndex], [field]: value };
    setModules(updated);
  };

  const toggleModuleExpanded = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].isExpanded = !updated[moduleIndex].isExpanded;
    setModules(updated);
  };

  const addLesson = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons.push({
      title: `Lesson ${updated[moduleIndex].lessons.length + 1}`,
      description: '',
      videoFile: null,
      thumbnailFile: null,
      isPreview: false,
      moderationStatus: 'pending',
    });
    setModules(updated);
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setModules(updated);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: any) => {
    const updated = [...modules];
    updated[moduleIndex].lessons[lessonIndex] = {
      ...updated[moduleIndex].lessons[lessonIndex],
      [field]: value,
    };
    setModules(updated);
  };

  const moderateContent = async (moduleIndex: number, lessonIndex: number, imageUrl: string) => {
    const lessonKey = `${moduleIndex}-${lessonIndex}`;
    setModeratingLesson(lessonKey);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to moderate content');
        return;
      }

      const response = await fetch(
        `https://ucqcrhfcflrepsdlcvpq.supabase.co/functions/v1/moderate-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ imageUrl, contentType: 'lesson_thumbnail' }),
        }
      );

      const result = await response.json();
      
      updateLesson(moduleIndex, lessonIndex, 'moderationStatus', result.status);
      updateLesson(moduleIndex, lessonIndex, 'moderationNotes', result.reason);

      if (result.status === 'rejected') {
        toast.error(`Content rejected: ${result.reason}`);
      } else if (result.status === 'needs_review') {
        toast.warning(`Content flagged for review: ${result.reason}`);
      } else {
        toast.success('Content approved!');
      }
    } catch (error) {
      console.error('Moderation error:', error);
      toast.error('Failed to moderate content');
    } finally {
      setModeratingLesson(null);
    }
  };

  const handleVideoUpload = async (moduleIndex: number, lessonIndex: number, file: File) => {
    updateLesson(moduleIndex, lessonIndex, 'videoFile', file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    updateLesson(moduleIndex, lessonIndex, 'videoUrl', previewUrl);
  };

  const handleThumbnailUpload = async (moduleIndex: number, lessonIndex: number, file: File) => {
    updateLesson(moduleIndex, lessonIndex, 'thumbnailFile', file);
    
    // Create preview URL and run moderation
    const previewUrl = URL.createObjectURL(file);
    updateLesson(moduleIndex, lessonIndex, 'thumbnailUrl', previewUrl);
    
    // Convert file to base64 for moderation
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Url = e.target?.result as string;
      await moderateContent(moduleIndex, lessonIndex, base64Url);
    };
    reader.readAsDataURL(file);
  };

  const saveModule = async (moduleIndex: number) => {
    if (!user || !courseId) return;

    const module = modules[moduleIndex];
    setSavingModule(module.id || `new-${moduleIndex}`);

    try {
      // Check for rejected content
      const hasRejectedContent = module.lessons.some(l => l.moderationStatus === 'rejected');
      if (hasRejectedContent) {
        toast.error('Cannot save module with rejected content. Please remove or replace flagged lessons.');
        setSavingModule(null);
        return;
      }

      let moduleId = module.id;

      if (!moduleId) {
        // Create new module
        const { data: newModule, error: moduleError } = await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            title: module.title,
            description: module.description,
            module_order: moduleIndex + 1,
          })
          .select()
          .single();

        if (moduleError) throw moduleError;
        moduleId = newModule.id;

        // Update local state with new ID
        const updated = [...modules];
        updated[moduleIndex].id = moduleId;
        setModules(updated);
      } else {
        // Update existing module
        await supabase
          .from('course_modules')
          .update({
            title: module.title,
            description: module.description,
            module_order: moduleIndex + 1,
          })
          .eq('id', moduleId);
      }

      // Save lessons
      for (let i = 0; i < module.lessons.length; i++) {
        const lesson = module.lessons[i];
        let videoUrl = lesson.videoUrl;
        let thumbnailUrl = lesson.thumbnailUrl;

        // Upload video if new file
        if (lesson.videoFile) {
          const videoPath = `course-videos/${user.id}/${courseId}/${moduleId}/${Date.now()}-${lesson.videoFile.name}`;
          const { error: videoError } = await supabase.storage
            .from('avatars')
            .upload(videoPath, lesson.videoFile);

          if (videoError) throw videoError;

          const { data: videoUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(videoPath);
          videoUrl = videoUrlData.publicUrl;
        }

        // Upload thumbnail if new file
        if (lesson.thumbnailFile) {
          const thumbPath = `lesson-thumbnails/${user.id}/${courseId}/${moduleId}/${Date.now()}-${lesson.thumbnailFile.name}`;
          const { error: thumbError } = await supabase.storage
            .from('avatars')
            .upload(thumbPath, lesson.thumbnailFile);

          if (thumbError) throw thumbError;

          const { data: thumbUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(thumbPath);
          thumbnailUrl = thumbUrlData.publicUrl;
        }

        const lessonData = {
          module_id: moduleId,
          course_id: courseId,
          title: lesson.title,
          description: lesson.description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          lesson_order: i + 1,
          is_preview: lesson.isPreview,
          moderation_status: lesson.moderationStatus,
          moderation_notes: lesson.moderationNotes,
        };

        if (lesson.id) {
          await supabase.from('course_lessons').update(lessonData).eq('id', lesson.id);
        } else {
          const { data: newLesson } = await supabase
            .from('course_lessons')
            .insert(lessonData)
            .select()
            .single();

          if (newLesson) {
            const updated = [...modules];
            updated[moduleIndex].lessons[i].id = newLesson.id;
            updated[moduleIndex].lessons[i].videoUrl = videoUrl;
            updated[moduleIndex].lessons[i].thumbnailUrl = thumbnailUrl;
            updated[moduleIndex].lessons[i].videoFile = null;
            updated[moduleIndex].lessons[i].thumbnailFile = null;
            setModules(updated);
          }
        }
      }

      toast.success('Module saved successfully!');
      onSave?.();
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    } finally {
      setSavingModule(null);
    }
  };

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'needs_review':
        return <Badge className="bg-yellow-500/20 text-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive"><Shield className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Course Modules</h3>
        <Button onClick={addModule} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Module
        </Button>
      </div>

      {modules.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No modules yet. Add your first module to get started.</p>
          <Button onClick={addModule} className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Module
          </Button>
        </Card>
      )}

      {modules.map((module, moduleIndex) => (
        <Card key={module.id || moduleIndex} className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
            <div className="flex-1">
              <Input
                value={module.title}
                onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                placeholder="Module title"
                className="font-semibold"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleModuleExpanded(moduleIndex)}
            >
              {module.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeModule(moduleIndex)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {module.isExpanded && (
            <div className="space-y-4 pl-8">
              <Textarea
                value={module.description}
                onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                placeholder="Module description (optional)"
                rows={2}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Lessons</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addLesson(moduleIndex)}
                    className="gap-1 h-7 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Add Lesson
                  </Button>
                </div>

                {module.lessons.map((lesson, lessonIndex) => (
                  <Card key={lesson.id || lessonIndex} className="p-3 bg-muted/30">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-medium text-muted-foreground pt-2">
                        {lessonIndex + 1}.
                      </span>
                      <div className="flex-1 space-y-3">
                        <Input
                          value={lesson.title}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                          placeholder="Lesson title"
                          className="h-8 text-sm"
                        />
                        <Textarea
                          value={lesson.description}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                          placeholder="Lesson description"
                          rows={2}
                          className="text-sm"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Video</Label>
                            <div className="border border-dashed rounded p-3 text-center">
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => e.target.files?.[0] && handleVideoUpload(moduleIndex, lessonIndex, e.target.files[0])}
                                className="hidden"
                                id={`video-${moduleIndex}-${lessonIndex}`}
                              />
                              <label htmlFor={`video-${moduleIndex}-${lessonIndex}`} className="cursor-pointer">
                                <Video className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">
                                  {lesson.videoFile?.name || lesson.videoUrl ? 'Video added ✓' : 'Upload video'}
                                </p>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Thumbnail</Label>
                            <div className="border border-dashed rounded p-3 text-center relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(moduleIndex, lessonIndex, e.target.files[0])}
                                className="hidden"
                                id={`thumb-${moduleIndex}-${lessonIndex}`}
                              />
                              <label htmlFor={`thumb-${moduleIndex}-${lessonIndex}`} className="cursor-pointer">
                                {lesson.thumbnailUrl ? (
                                  <img src={lesson.thumbnailUrl} alt="Thumbnail" className="w-full h-12 object-cover rounded" />
                                ) : (
                                  <>
                                    <div className="w-6 h-6 mx-auto bg-muted rounded mb-1" />
                                    <p className="text-xs text-muted-foreground">Upload thumbnail</p>
                                  </>
                                )}
                              </label>
                              {moderatingLesson === `${moduleIndex}-${lessonIndex}` && (
                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={lesson.isPreview}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'isPreview', e.target.checked)}
                                className="rounded"
                              />
                              <Eye className="w-3 h-3" />
                              Free Preview
                            </label>
                            {getModerationBadge(lesson.moderationStatus)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLesson(moduleIndex, lessonIndex)}
                            className="h-7 w-7 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {lesson.moderationNotes && lesson.moderationStatus !== 'approved' && (
                          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {lesson.moderationNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {module.lessons.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No lessons in this module yet
                  </p>
                )}
              </div>

              <Button
                onClick={() => saveModule(moduleIndex)}
                disabled={savingModule === (module.id || `new-${moduleIndex}`)}
                className="w-full"
              >
                {savingModule === (module.id || `new-${moduleIndex}`) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Module'
                )}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
