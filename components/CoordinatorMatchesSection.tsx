import React from "react";
import { View } from "react-native";
import CoordinatorMatchList from "./CoordinatorMatchList";

interface CoordinatorMatchesSectionProps {
  ladderId: string;
}

const CoordinatorMatchesSection: React.FC<CoordinatorMatchesSectionProps> = ({ ladderId }) => {
  // Show both singles and doubles pending matches
  return (
    <View>
      <CoordinatorMatchList ladderId={ladderId} isDoubles={false} />
      <CoordinatorMatchList ladderId={ladderId} isDoubles={true} />
    </View>
  );
};

export default CoordinatorMatchesSection;
