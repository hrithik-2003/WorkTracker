import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, Modal } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { useWorkoutStore } from "@/lib/store";
import { getTemplates, getTemplateDetails, deleteTemplate, Template } from "@/lib/api/templates";
import { getWorkoutHistory, getMonthlyWorkoutCount, WorkoutRecord } from "@/lib/api/workouts";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dumbbell, Calendar, TrendingUp, ChevronDown, Edit2, Trash2, Clock } from "lucide-react-native";

export default function Dashboard() {
    const startWorkout = useWorkoutStore((state) => state.startWorkout);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [recentWorkouts, setRecentWorkouts] = useState<WorkoutRecord[]>([]);
    const [monthlyCount, setMonthlyCount] = useState<number>(0);
    const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);
    const [exampleRoutinesExpanded, setExampleRoutinesExpanded] = useState(false);

    // Context menu state
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showContextMenu, setShowContextMenu] = useState(false);

    const fetchData = useCallback(async () => {
        const [templatesData, historyData, monthlyData] = await Promise.all([
            getTemplates(),
            getWorkoutHistory(),
            getMonthlyWorkoutCount()
        ]);
        setTemplates(templatesData);
        setRecentWorkouts(historyData.slice(0, 3));
        setMonthlyCount(monthlyData);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleStartTemplate = async (templateId: string, templateName: string) => {
        setStartingTemplateId(templateId);
        const details = await getTemplateDetails(templateId);

        if (details) {
            // Start workout with pre-filled exercises
            startWorkout(templateName, details.exercises);
            router.push("/workout");
        }
        setStartingTemplateId(null);
    };

    const handleLongPress = (template: Template) => {
        setSelectedTemplate(template);
        setShowContextMenu(true);
    };

    const handleEdit = () => {
        setShowContextMenu(false);
        if (selectedTemplate) {
            router.push(`/templates/edit?id=${selectedTemplate.id}`);
        }
    };

    const handleDelete = () => {
        setShowContextMenu(false);
        if (selectedTemplate) {
            Alert.alert(
                "Delete Routine",
                `Are you sure you want to delete "${selectedTemplate.name}"? This cannot be undone.`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            const result = await deleteTemplate(selectedTemplate.id);
                            if (result.success) {
                                fetchData(); // Refresh the list
                            } else {
                                Alert.alert("Error", "Failed to delete routine.");
                            }
                        },
                    },
                ]
            );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const formatDuration = (start: string, end: string | null) => {
        if (!end) return "—";
        const ms = new Date(end).getTime() - new Date(start).getTime();
        const mins = Math.floor(ms / 60000);
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    return (
        <ScreenLayout>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Header */}
                <View className="mb-8 mt-4">
                    <Text className="text-zinc-400 text-lg">Good Evening,</Text>
                    <Text className="text-white text-3xl font-bold">Time to crush it!</Text>
                </View>

                {/* Quick Start */}
                <Card className="mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Text className="text-white text-xl font-bold">Quick Start</Text>
                            <Text className="text-zinc-400 text-sm">Start an empty workout</Text>
                        </View>
                        <View className="bg-blue-500/20 p-3 rounded-full">
                            <Dumbbell size={24} color="#3b82f6" />
                        </View>
                    </View>
                    <Button
                        title="Start Workout"
                        onPress={() => {
                            startWorkout();
                            router.push("/workout");
                        }}
                    />
                </Card>

                {/* Stats Overview */}
                <Text className="text-white text-2xl font-bold mb-4 mx-1">Overview</Text>
                <View className="flex-row gap-4 mb-10 mx-1">
                    <Card className="flex-1 flex-row items-center gap-3">
                        <Calendar size={24} color="#a1a1aa" />
                        <View>
                            <Text className="text-white font-bold text-base">{monthlyCount > 0 ? `${monthlyCount} ${monthlyCount === 1 ? 'Workout' : 'Workouts'}` : "- Workouts"}</Text>
                            <Text className="text-zinc-400 text-sm">{new Date().toLocaleDateString("en-US", { month: "long" })}</Text>
                        </View>
                    </Card>
                    <Card className="flex-1 flex-row items-center gap-3">
                        <Clock size={24} color="#a1a1aa" />
                        <View>
                            <Text className="text-white font-bold text-base" numberOfLines={1}>
                                {recentWorkouts.length > 0 ? recentWorkouts[0].name : "—"}
                            </Text>
                            <Text className="text-zinc-400 text-sm">
                                {recentWorkouts.length > 0 ? formatDate(recentWorkouts[0].created_at) : "No workouts yet"}
                            </Text>
                        </View>
                    </Card>
                </View>

                {/* Custom Routines */}
                <View className="flex-row justify-between items-center mb-4 mx-1">
                    <Text className="text-white text-2xl font-bold">My Routines</Text>
                    <TouchableOpacity
                        className="flex-row items-center bg-blue-600 px-3 py-1.5 rounded-full gap-1"
                        onPress={() => router.push("/templates/create")}
                    >
                        <Text className="text-white text-lg font-bold">+</Text>
                        <Text className="text-white text-sm font-medium">Add</Text>
                    </TouchableOpacity>
                </View>

                {templates.filter(t => t.is_custom).length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 gap-4 mx-1">
                        {templates.filter(t => t.is_custom).map((template) => (
                            <TouchableOpacity
                                key={template.id}
                                onLongPress={() => handleLongPress(template)}
                                delayLongPress={500}
                                activeOpacity={0.9}
                            >
                                <Card className="w-64 mr-4">
                                    <View className="mb-2">
                                        <View className="flex-row justify-between items-start">
                                            <Text className="text-white text-lg font-bold flex-1 mr-2">{template.name}</Text>
                                            <View className="bg-blue-500/20 px-2 py-1 rounded">
                                                <Text className="text-blue-400 text-[10px] font-bold uppercase">Custom</Text>
                                            </View>
                                        </View>
                                        {template.description ? (
                                            <Text className="text-zinc-500 text-xs mt-1" numberOfLines={2}>{template.description}</Text>
                                        ) : null}
                                    </View>
                                    <View className="flex-row items-center mb-2">
                                        <Dumbbell size={14} color="#71717a" />
                                        <Text className="text-zinc-400 text-xs ml-1">
                                            {template.exercise_count} exercises
                                        </Text>
                                    </View>
                                    <Button
                                        title={startingTemplateId === template.id ? "Loading..." : "Start"}
                                        variant="secondary"
                                        className="py-2 min-h-0"
                                        textClassName="text-sm"
                                        onPress={() => handleStartTemplate(template.id, template.name)}
                                    />
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <Card className="mb-10 mx-1 border-dashed border-zinc-800 bg-transparent">
                        <View className="items-center py-4">
                            <Dumbbell size={24} color="#3f3f46" className="mb-2" />
                            <Text className="text-zinc-500 text-sm">No custom routines yet.</Text>
                            <Text className="text-zinc-600 text-xs">Create one to get started!</Text>
                        </View>
                    </Card>
                )}

                {/* System Templates - Collapsible */}
                <TouchableOpacity
                    className="flex-row justify-between items-center mb-4 mx-1"
                    onPress={() => setExampleRoutinesExpanded(!exampleRoutinesExpanded)}
                    activeOpacity={0.7}
                >
                    <Text className="text-white text-2xl font-bold">Example Routines</Text>
                    <View style={{ transform: [{ rotate: exampleRoutinesExpanded ? '180deg' : '0deg' }] }}>
                        <ChevronDown size={24} color="#71717a" />
                    </View>
                </TouchableOpacity>

                {exampleRoutinesExpanded && templates.filter(t => !t.is_custom).length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 gap-4 mx-1">
                        {templates.filter(t => !t.is_custom).map((template) => (
                            <Card key={template.id} className="w-64 mr-4">
                                <View className="mb-2">
                                    <Text className="text-white text-lg font-bold">{template.name}</Text>
                                    <Text className="text-zinc-500 text-xs" numberOfLines={2}>{template.description}</Text>
                                </View>
                                <View className="flex-row items-center mb-2">
                                    <Dumbbell size={14} color="#71717a" />
                                    <Text className="text-zinc-400 text-xs ml-1">
                                        {template.exercise_count} exercises
                                    </Text>
                                </View>
                                <Button
                                    title={startingTemplateId === template.id ? "Loading..." : "Start"}
                                    variant="secondary"
                                    className="py-2 min-h-0"
                                    textClassName="text-sm"
                                    onPress={() => handleStartTemplate(template.id, template.name)}
                                />
                            </Card>
                        ))}
                    </ScrollView>
                )}

                {exampleRoutinesExpanded && templates.filter(t => !t.is_custom).length === 0 && (
                    <Card className="mb-6 mx-1">
                        <Text className="text-zinc-500 text-center">No example routines found.</Text>
                    </Card>
                )}

                {/* Recent Activity */}
                <Text className="text-white text-2xl font-bold mb-4 mx-1">Recent Activity</Text>
                {recentWorkouts.length > 0 ? (
                    <View className="mx-1">
                        {recentWorkouts.map((workout) => (
                            <Card key={workout.id} className="mb-4">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-white font-semibold">{workout.name}</Text>
                                    <Text className="text-zinc-500 text-sm">{formatDate(workout.started_at)}</Text>
                                </View>
                                <Text className="text-zinc-400 text-sm">
                                    {workout.workout_exercises?.length || 0} exercises • {formatDuration(workout.started_at, workout.ended_at)}
                                </Text>
                            </Card>
                        ))}
                    </View>
                ) : (
                    <Card className="mb-4 mx-1">
                        <Text className="text-zinc-500 text-center">No recent workouts</Text>
                    </Card>
                )}
            </ScrollView>

            {/* Context Menu Modal */}
            <Modal
                visible={showContextMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowContextMenu(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/70 justify-center items-center"
                    activeOpacity={1}
                    onPress={() => setShowContextMenu(false)}
                >
                    <View className="bg-zinc-900 rounded-2xl w-72 overflow-hidden border border-zinc-800">
                        <Text className="text-white font-bold text-lg p-4 border-b border-zinc-800 text-center">
                            {selectedTemplate?.name}
                        </Text>
                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-zinc-800"
                            onPress={handleEdit}
                        >
                            <Edit2 size={20} color="#3b82f6" />
                            <Text className="text-white text-base ml-3">Edit Routine</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-row items-center p-4"
                            onPress={handleDelete}
                        >
                            <Trash2 size={20} color="#ef4444" />
                            <Text className="text-red-500 text-base ml-3">Delete Routine</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScreenLayout>
    );
}
