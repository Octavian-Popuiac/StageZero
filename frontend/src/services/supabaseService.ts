import { createClient } from "@supabase/supabase-js";
import { CompetitorPositionProps } from "../components/PrologosPosition";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env or Vercel settings.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface StartPosition {
  position: number;
  competitor: CompetitorPositionProps | null;
}

export interface CurrentSelection {
  id: number;
  selecting_competitor_id: number | null;
  current_position: number;
  session_id: string;
  updated_at: string;
}

const toSnakeCase = (team: CompetitorPositionProps) => ({
  number: team.number,
  car_brand: team.carBrand,
  pilot_name: team.pilotName,
  pilot_country: team.pilotCountry,
  navigator_name: team.navigatorName,
  navigator_country: team.navigatorCountry,
  time: team.time,
})

const toCamelCase = (dbTeam: any): CompetitorPositionProps => ({
  number: dbTeam.number,
  carBrand: dbTeam.car_brand,
  pilotName: dbTeam.pilot_name,
  pilotCountry: dbTeam.pilot_country,
  navigatorName: dbTeam.navigator_name,
  navigatorCountry: dbTeam.navigator_country,
  time: dbTeam.time,
})

export const teamService = {
  async getTeams(): Promise<CompetitorPositionProps[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
    
    return (data || []).map(toCamelCase);
  },
  
  async addTeam(team: CompetitorPositionProps): Promise<void> {
    const dbTeam = toSnakeCase(team);
    
    const { error } = await supabase
      .from('teams')
      .insert([dbTeam]);

    if (error) {
      console.error('Error adding team:', error);
      throw error;
    }
  },

  async updateTeam(team: CompetitorPositionProps): Promise<void> {
    const dbTeam = toSnakeCase(team);
    const { error } = await supabase
      .from('teams')
      .update(dbTeam)
      .eq('number', team.number);
    
    if ( error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  async deleteTeam(teamNumber: number): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('number', teamNumber);
    
    if (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  async resetTeams(): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .gte('number', 0);

    if (error) {
      console.error('Error resetting teams:', error);
      throw error;
    }
  },

  subscribeToTeamChanges(callback: (teams: CompetitorPositionProps[]) => void) {
    const subscription = supabase
      .channel('teams_changes')
      .on('postgres_changes',
        { event: '*',
          schema: 'public',
          table: 'teams'
        },
        async (payload) => {
          console.log('Change detected!', payload);
          try {
            const teams = await this.getTeams();
            callback(teams);
          }catch (err) {
            console.error('Error fetching teams after change:', err);
          }
        }
      )
      .subscribe();

    return subscription;
  }
};

export const positionService = {
  async getStartPositions(sessionId : string = 'default'): Promise<StartPosition[]> {
    const { data, error } = await supabase
      .from('start_position')
      .select(`
        position,
        team_number,
        teams (
          number,
          car_brand,
          pilot_name,
          pilot_country,
          navigator_name,
          navigator_country,
          time
        )
      `)
      .eq('session_id', sessionId)
      .order('position');

      if (error) {
      console.error('Error fetching start positions:', error);
      throw error;
    }

    const allPosition : StartPosition[] = Array.from({length: 10}, (_, i) => ({
      position: i + 1,
      competitor: null
    }));

    (data || []).forEach((item) => {
      const competitor = toCamelCase(item.teams);
      allPosition[item.position - 1] = {
        position: item.position,
        competitor
      };
    });

    return allPosition;
  },

  async setStartPosition(
    position: number,
    teamNumber: number,
    sessionId: string = 'default'
  ): Promise<void> {
    const {data: existing} = await supabase
      .from('start_position')
      .select('team_number')
      .eq('position', position)
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      throw new Error(`Position ${position} is already occupied.`);
    }

    const { error } = await supabase
      .from('start_position')
      .insert([{
        position,
        team_number: teamNumber,
        session_id: sessionId
      }]);

    if (error) {
      console.error('Error setting start position:', error);
      throw error;
    }
  },

  async removeStartPosition(
    position: number,
    sessionId: string = 'default'
  ): Promise<void> {
    const { error } = await supabase
      .from('start_position')
      .delete()
      .eq('position', position)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error removing start position:', error);
      throw error;
    }
  },

  async resetStartPositions(
    session: string = 'default'
  ): Promise<void> {
    const { error } = await supabase
      .from('start_position')
      .delete()
      .eq('session_id', session);

    if (error) {
      console.error('Error resetting start positions:', error);
      throw error;
    }
  },

  subscribeToStartPositionChanges(
    callback: (positions: StartPosition[]) => void,
    sessionId: string = 'default'
  ) {
    const subscription = supabase
      .channel('start_positions_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'start_position'
        },
        async (payload) => {
          console.log('Start position change detected!', payload);
          try {
            const positions = await this.getStartPositions(sessionId);
            callback(positions);
          } catch (err) {
            console.error('Error fetching start positions after change:', err);
          }
        }
      )
      .subscribe();

    return subscription;
  }
}

export const selectionService = {
  async getCurrentSelection(sessionId: string = 'default'): Promise<CurrentSelection | null> {
    try {
      const { data, error } = await supabase
        .from('current_selection')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (error) {
        console.error('Error fetching current selection:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentSelection:', error);
      return null;
    }
  },

  async updateCurrentSelection(
    selectingCompetitorId: number | null,
    currentPosition: number,
    sessionId: string = 'default'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('current_selection')
        .upsert({
          id: 1,
          selecting_competitor_id: selectingCompetitorId,
          current_position: currentPosition,
          session_id: sessionId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if( error ) {
        console.error('Error updating current selection:', error);
        throw error;
      }

      console.log('Synced selection to Supabase:', {
        competitor: selectingCompetitorId,
        position: currentPosition
      });
    } catch ( error ){
      console.error('Error in updateCurrentSelection:', error);
      throw error;
    }
  },

  async resetCurrentSelection(sessionId: string = 'default'): Promise<void> {
    try {
      const { error } = await supabase
        .from('current_selection')
        .upsert({
          id: 1,
          selecting_competitor_id: null,
          current_position: 1,
          session_id: sessionId,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error resetting current selection:', error);
        throw error;
      }

      console.log('Reset current selection');
    } catch (error) {
      console.error('Error resetting current selection:', error);
      throw error;
    }
  },

  subscribeToSelectionChanges(
    callback: (selection: CurrentSelection) => void,
    sessionId: string = 'default'
  ) {
    console.log('📡 Creating realtime channel for current_selection');
    
    const channel = supabase
      .channel('selection-changes-' + Date.now()) 
      .on('postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'current_selection',
          filter: `id=eq.1` 
        },
        (payload) => {
          console.log('🔔 REALTIME EVENT:', {
            type: payload.eventType,
            old: payload.old,
            new: payload.new,
            timestamp: new Date().toLocaleTimeString()
          });
          
          if ((payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') && payload.new) {
            callback(payload.new as CurrentSelection);
          }
        }
      )
      .subscribe((status, error) => {
        console.log('Subscription status:', status);
        if (error) {
          console.error('Subscription error:', error);
        }
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected successfully!');
        }
      });

    return channel;
  }
}

export const swapPositions = async (from: number, to: number) => {
  const { data: fromData } = await supabase
    .from('start_position')
    .select('*')
    .eq('position', from)
    .single();

  const { data: toData } = await supabase
    .from('start_position')
    .select('*')
    .eq('position', to)
    .single();

  await supabase
    .from('start_position')
    .update({ team_number: toData.team_number})
    .eq('position', from);

  await supabase
    .from('start_position')
    .update({ team_number: fromData.team_number})
    .eq('position', to);
}

