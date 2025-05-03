import * as userService from '../services/userService';

//ROLE: validaete user input 

//Handle user registration
export async function signUp(req: any, res: any) {
  try {
    //perform basic http request validation
    if (
      !req.body.email ||
      !req.body.userId ||
      !req.body.birthdate ||
      !req.body.name ||
      !req.body.photo
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    //pass the request body to the userService
    const user = await userService.registerUser(req.body);

    //Send success back to the client
    res
      .status(201) // ← set status code to 201 Created
      .json({ data: user }); // ← send back JSON payload
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
