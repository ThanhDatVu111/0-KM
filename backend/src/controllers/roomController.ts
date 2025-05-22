import * as roomService from '../services/roomService';

//ROLE: validate user input

//Handle user registration
export async function createRoom(req: any, res: any) {
  try {
    //perform basic http request validation
    if (!req.body.room_id || !req.body.user_1) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    //pass the request body to the userService
    const room = await roomService.registerRoom(req.body);

    //Send success back to the client
    res
      .status(201) // ← set status code to 201 Created
      .json({ data: room }); // ← send back JSON payload
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'room already created' });
    }
    res.status(500).json({ error: err.message });
  }
}

export async function checkRoom(req: any, res: any) {
  try {
    if (!req.body.room_id) {
      return res.status(400).json({ error: 'missing room id' });
    }

    const response = await roomService.checkRoom(req.body);
    return res.json({ response });
    
    return response;

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function joinRoom(req: any, res: any) {
  try {
    //perform basic http request validation
    if (!req.body.room_id || !req.body.user_2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const exists = await roomService.checkRoom({ room_id: req.body.room_id });
    if (!exists){
      return res.status(404).json({ error: '(join) room not found' });
    }
    //pass the request body to the userService
    await roomService.joinRoom(req.body);

    res.status(204).send(); // ← set status code to 201 Created
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteRoom(req: any, res: any) {
  try {
    const { room_id } = req.params;

    if (!room_id) {
      return res.status(400).json({ error: 'Missing required room_id parameter' });
    }

    const exists = await roomService.checkRoom({ room_id});
    if (!exists) {
      return res.status(404).json({ error: '(delete) room not found' });
    }

    await roomService.deleteRoom({ room_id });

    // Send success back to the client
    res.status(204).send(); // No content
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}