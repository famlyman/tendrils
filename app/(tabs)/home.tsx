// app/(tabs)/home.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from "react-native";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { useDemoData } from "../../components/DemoDataContext";

import { useRouter } from "expo-router";
import { Tabs } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';
import CreateTeamModal from "../../components/CreateTeamModal";

const SEGMENTS = ["Singles", "Doubles"];

import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Home() {
  // TODO: Replace with actual current user id from auth context
  const currentUserId = "user-1";
  const [challengeTarget, setChallengeTarget] = React.useState<ChallengeTarget>(null);
  const { demoMode, standings, teams, profiles, addDemoTeam } = useDemoData();
  const router = useRouter();
  const [segment, setSegment] = React.useState("Singles");
  const [modalVisible, setModalVisible] = React.useState(false);
  // For demo: pick the first vine's standings (or use a selected vine id if you have one)
  const currentStandings = demoMode ? standings[0] : null;
  interface PlayerProfile {
    user_id: string;
    name: string;
    rating: number;
    wins?: number;
    losses?: number;
    [key: string]: any;
  }
  interface TeamProfile {
    team_id: string;
    name: string;
    members: string[];
    wins: number;
    losses: number;
    win_percentage: number;
    [key: string]: any;
  }
  type ChallengeTarget = PlayerProfile | TeamProfile | null;

  // Merge in wins/losses from demoProfiles for each player in standings
  const rankingData: PlayerProfile[] = currentStandings
    ? currentStandings.rankings.map((p: any) => {
        const profile = profiles.find((pr: any) => pr.user_id === p.user_id);
        return {
          ...p,
          wins: profile?.wins ?? 0,
          losses: profile?.losses ?? 0,
        };
      })
    : [];
  // For doubles: use teamStandings from context for the current vine
  const { teamStandings } = useDemoData();
  const currentVineId = currentStandings ? currentStandings.vine_id : null;
  const doublesStandings = demoMode && currentVineId ? teamStandings.find(t => t.vine_id === currentVineId)?.rankings || [] : [];

  return (
    <BackgroundWrapper>
      {/* Settings Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 32,
          right: 24,
          zIndex: 100,
          backgroundColor: '#fff',
          borderRadius: 20,
          padding: 6,
          elevation: 3,
        }}
        onPress={() => router.push('/settings')}
      >
        <MaterialIcons name="settings" size={28} color={COLORS.secondary} />
      </TouchableOpacity>
      {/* Challenge Modal at top level */}
      {challengeTarget && (
        <Modal
          visible={!!challengeTarget}
          transparent
          animationType="slide"
          onRequestClose={() => setChallengeTarget(null)}
        >
          <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.4)'}}>
            <View style={{backgroundColor:'#fff', padding:24, borderRadius:12, minWidth:260, alignItems:'center'}}>
              <Text style={{fontSize:18, fontWeight:'bold', marginBottom:8}}>
                Challenge {challengeTarget.name}?
              </Text>
              {"user_id" in challengeTarget ? (
                // Singles modal
                <>
                  <Text style={{fontSize:15, marginBottom:4}}>
                    Rank: {rankingData.findIndex(p => p.user_id === challengeTarget.user_id) + 1}   Rating: {challengeTarget.rating}
                  </Text>
                  <Text style={{fontSize:15, marginBottom:16}}>
                    W-L: {challengeTarget.wins ?? 0}-{challengeTarget.losses ?? 0}  Win%: {challengeTarget.wins !== undefined && challengeTarget.losses !== undefined && (challengeTarget.wins + challengeTarget.losses) > 0 ? Math.round((challengeTarget.wins / (challengeTarget.wins + challengeTarget.losses)) * 100) : 0}%
                  </Text>
                </>
              ) : (
                // Doubles modal
                <>
                  <Text style={{fontSize:15, marginBottom:4}}>
                    Members: {challengeTarget.members.map((id: string) => {
                      const p = profiles.find((pr: any) => pr.user_id === id);
                      return p ? p.name : id;
                    }).join(", ")}
                  </Text>
                  <Text style={{fontSize:15, marginBottom:16}}>
                    W-L: {challengeTarget.wins ?? 0}-{challengeTarget.losses ?? 0}  Win%: {challengeTarget.win_percentage !== undefined ? (challengeTarget.win_percentage * 100).toFixed(0) : 0}%
                  </Text>
                </>
              )}
              <View style={{flexDirection:'row', gap: 16}}>
                <TouchableOpacity
                  style={{paddingVertical:8, paddingHorizontal:18, backgroundColor:COLORS.primaryGradient[1], borderRadius:8, marginRight:8}}
                  onPress={() => {/* TODO: implement challenge logic */ setChallengeTarget(null);}}>
                  <Text style={{color:'#fff', fontWeight:'bold'}}>Send Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{paddingVertical:8, paddingHorizontal:18, backgroundColor:'#eee', borderRadius:8}}
                  onPress={() => setChallengeTarget(null)}>
                  <Text style={{color:COLORS.secondary, fontWeight:'bold'}}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <View style={styles.container}>
        <View style={styles.segmentedControl}>
          {SEGMENTS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.segment, segment === s && styles.segmentActive]}
              onPress={() => setSegment(s)}
            >
              <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {demoMode ? (
          segment === "Singles" ? (
            <>
            <FlatList
              data={rankingData}
              showsVerticalScrollIndicator={false}
              keyExtractor={item => item.user_id}
              renderItem={({ item, index }) => (
                <View style={styles.singlesCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={styles.rank}>{index + 1}</Text>
                    <Text style={[styles.name, { fontWeight: 'bold', fontSize: 17, marginLeft: 8 }]}>{item.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.rating}>Rating: {item.rating}</Text>
                    {item.user_id !== currentUserId && (
                      <TouchableOpacity
                        style={styles.challengeBtn}
                        onPress={() => setChallengeTarget(item)}
                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                      >
                        <MaterialCommunityIcons name="sword-cross" size={24} color={COLORS.primaryGradient[1]} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={{ color: COLORS.text.dark, fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>
                    W-L: {item.wins ?? 0}-{item.losses ?? 0}  Win%: {item.wins !== undefined && item.losses !== undefined && (item.wins + item.losses) > 0 ? Math.round((item.wins / (item.wins + item.losses)) * 100) : 0}%
                  </Text>
                </View>
              )}
              style={{ marginTop: 16 }}
            />
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.createTeamBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.createTeamBtnText}>+ Create Team</Text>
              </TouchableOpacity>
              <FlatList
                data={doublesStandings}
                showsVerticalScrollIndicator={false}
                keyExtractor={item => item.team_id}
                renderItem={({ item, index }) => {
                  // Check if current user is a member of this team
                  const isMyTeam = item.members.includes(currentUserId);
                  return (
                    <View style={styles.doublesCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={styles.rank}>{index + 1}.</Text>
                        <Text style={[styles.name, { fontWeight: 'bold', fontSize: 17, marginLeft: 8 }]}>{item.name}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: COLORS.primaryGradient[1], fontSize: 15, marginBottom: 2 }}>
                          Members: {item.members.map((id: string) => {
                            const p = profiles.find(p => p.user_id === id);
                            return p ? p.name : id;
                          }).join(", ")}
                        </Text>
                        {!isMyTeam && (
                          <TouchableOpacity
                            style={styles.challengeBtn}
                            onPress={() => setChallengeTarget(item)}
                            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                          >
                            <MaterialCommunityIcons name="sword-cross" size={24} color={COLORS.primaryGradient[1]} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={{ color: COLORS.secondary, fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
                        W-L: {item.wins}-{item.losses}  Win%: {(item.win_percentage * 100).toFixed(0)}%
                      </Text>
                    </View>
                  );
                }}
                style={{ marginTop: 16 }}
                ListEmptyComponent={<Text style={{color: 'red', textAlign: 'center'}}>No teams found for this club.</Text>}
              />
              <CreateTeamModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onCreate={team => addDemoTeam(team)}
                currentUserId={"user-1"}
              />
            </>
          )
        ) : (
          <Text style={styles.subtitle}>This is your home screen. Start climbing the ladder!</Text>
        )}
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  challengeBtn: {
    marginLeft: 'auto',
    backgroundColor: '#F8E71C22',
    borderRadius: 16,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singlesCard: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 0,
    elevation: 2,
    width: '96%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  segmentedControl: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#D0F2E8",
  },
  segment: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 16,
  },
  segmentActive: {
    backgroundColor: "#FFD54F",
  },
  segmentText: {
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    fontSize: 16,
  },
  segmentTextActive: {
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
  createTeamBtn: {
    backgroundColor: "#FFD54F",
    borderRadius: 20,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginTop: 10,
    marginBottom: 4,
  },
  createTeamBtnText: {
    color: "#1A3C34",
    fontFamily: "Roboto-Bold",
    fontSize: 16,
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.landing.tagline,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.secondary,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Roboto-Bold",
    color: COLORS.text.dark,
    marginBottom: 16,
  },

  doublesCard: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 0,
    elevation: 2,
    width: '96%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rank: {
    fontSize: 18,
    fontWeight: "bold",
    width: 30,
    textAlign: "center",
    color: COLORS.secondary,
  },
  name: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
    color: COLORS.text.dark,
  },
  rating: {
    fontSize: 15,
    color: COLORS.text.dark,
    marginLeft: 12,
    marginTop: 2,
  },
});