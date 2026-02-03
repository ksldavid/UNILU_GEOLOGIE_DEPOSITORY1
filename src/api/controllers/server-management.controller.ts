import { Request, Response } from 'express'

export const getServersStatus = async (req: Request, res: Response) => {
    try {
        // En vrai on utiliserait des API comme AWS SDK, Azure ou Docker Stats
        // Pour le dashboard UNILU, on simule l'état des noeuds d'infrastructure
        const servers = [
            { id: '1', name: 'UNILU-API-PROD-01', status: 'Online', cpu: Math.floor(Math.random() * 30) + 10, ram: 4.2, storage: 45, region: 'LUBUMBASHI-MAIN', type: 'Node-v24' },
            { id: '2', name: 'UNILU-DB-PRIMARY', status: 'Online', cpu: Math.floor(Math.random() * 20) + 5, ram: 16.5, storage: 68, region: 'LUBUMBASHI-MAIN', type: 'Postgre-15' },
            { id: '3', name: 'UNILU-FRONT-VITE', status: 'Online', cpu: Math.floor(Math.random() * 15) + 5, ram: 2.1, storage: 12, region: 'LUBUMBASHI-EDGE', type: 'Static-JS' },
            { id: '4', name: 'WORKER-REPORTS-PDF', status: 'Standby', cpu: 2, ram: 1.2, storage: 85, region: 'LUBUMBASHI-MAIN', type: 'Task-Runner' },
            { id: '5', name: 'CDN-REPLICA-GOMA', status: 'Offline', cpu: 0, ram: 0, storage: 0, region: 'GOMA-EAST', type: 'Edge-Cache' },
        ];

        res.json(servers);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération de l'état des serveurs" });
    }
}

export const toggleServerPower = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action } = req.body; // 'start', 'stop', 'restart'

    // Simulation d'action
    res.json({ message: `Action ${action} envoyée au serveur ${id} avec succès.` });
}
