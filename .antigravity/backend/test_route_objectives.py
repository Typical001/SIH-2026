import unittest
import networkx as nx
from route_objectives import search_profile, corridor_overlap, edge_metrics

class RouteObjectivesTests(unittest.TestCase):
    def test_each_objective_selects_its_actual_optimum(self):
        graph=nx.DiGraph()
        # Three independently feasible corridors with different time/exposure.
        for node,time,ice in [('quick',10,5),('middle',15,2),('low_ice',30,1)]:
            graph.add_edge('start',node,eta_hours=time,ice_exposure_hours=ice,balanced_cost=time+4*ice)
            graph.add_edge(node,'end',eta_hours=1,ice_exposure_hours=0,balanced_cost=1)
        for profile,node in [('FASTEST','quick'),('BALANCED','middle'),('SAFEST','low_ice')]:
            self.assertEqual(search_profile(graph,'start','end',profile),['start',node,'end'])

    def test_zero_ice_ties_use_time_and_do_not_force_detours(self):
        graph=nx.DiGraph()
        for node,time in [('short',5),('long',50)]:
            graph.add_edge('start',node,eta_hours=time,ice_exposure_hours=0,balanced_cost=time)
            graph.add_edge(node,'end',eta_hours=1,ice_exposure_hours=0,balanced_cost=1)
        for profile in ('FASTEST','BALANCED','SAFEST'):
            self.assertEqual(search_profile(graph,'start','end',profile),['start','short','end'])

    def test_overlap_recognizes_shared_geometry_and_dateline(self):
        a=[[-58,179],[-58,181]]
        b=[[-58,179],[-58,180],[-58,-179]]
        self.assertAlmostEqual(corridor_overlap(a,b),100)
        self.assertEqual(corridor_overlap(a,[[-50,179],[-50,181]]),0)

    def test_current_direction_changes_time_at_same_commanded_speed(self):
        edge=dict(distance_nm=100,sic=0,mean_sic=0)
        east=edge_metrics((-52,0),(-52,5),edge,14.5)
        west=edge_metrics((-52,5),(-52,0),edge,14.5)
        self.assertLess(east['eta_hours'],west['eta_hours'])
        self.assertEqual(east['ice_exposure_hours'],0)

if __name__=='__main__': unittest.main()
