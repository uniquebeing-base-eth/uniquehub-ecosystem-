import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, DollarSign, BookOpen, Users, Star } from "lucide-react";

export const TutorSection = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Tutor Dashboard</h1>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">0</div>
          <div className="text-sm text-muted-foreground">Courses Created</div>
        </Card>
        <Card className="p-4 text-center">
          <Users className="w-8 h-8 text-success mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">0</div>
          <div className="text-sm text-muted-foreground">Total Students</div>
        </Card>
        <Card className="p-4 text-center">
          <DollarSign className="w-8 h-8 text-warning mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">0</div>
          <div className="text-sm text-muted-foreground">USDC Earned</div>
        </Card>
      </div>

      {/* Create Course Form */}
      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Create New Course</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Course Title</label>
              <Input placeholder="Enter course title..." />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
              <Textarea placeholder="Describe what students will learn..." rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Price (USDC)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="0.00" className="pl-8" type="number" step="0.01" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                <select className="w-full p-2 rounded-md border border-input bg-background text-foreground">
                  <option>Select category</option>
                  <option>Web3 Basics</option>
                  <option>DeFi</option>
                  <option>NFTs</option>
                  <option>Trading</option>
                  <option>Development</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Course Thumbnail</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button className="bg-primary hover:bg-primary/90">
                Create Course
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* My Courses */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">My Courses</h3>
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No courses yet</h4>
          <p className="text-muted-foreground mb-4">Create your first course to start earning from your expertise</p>
          <Button 
            onClick={() => setShowCreateForm(true)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Course
          </Button>
        </div>
      </Card>

      {/* Tips for Success */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Tips for Success</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Create Engaging Content</h4>
              <p className="text-sm text-muted-foreground">Use clear explanations, practical examples, and interactive elements</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Price Competitively</h4>
              <p className="text-sm text-muted-foreground">Research similar courses and price accordingly to attract students</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Engage with Students</h4>
              <p className="text-sm text-muted-foreground">Respond to questions and provide support to build a good reputation</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};