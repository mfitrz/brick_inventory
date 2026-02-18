namespace LegoWebAppBlazor.Models;

// Matches the JSON your FastAPI returns: {"set_number": 75331, "name": "The Razor Crest"}
public class LegoSetDto(int setNumber, string name)
{
    public readonly int SetNumber = setNumber;
    public readonly string Name = name;
}
