namespace LegoWebApp.Models;

public class LegoSetDto(int setNumber, string name)
{
    public int SetNumber { get; } = setNumber;
    public string Name { get; } = name;
}
