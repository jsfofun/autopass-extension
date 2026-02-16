import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PlaygroundPage() {
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Playground</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input type="text" placeholder="Enter your name" />
                </CardContent>
                <CardFooter>
                    <Button>Submit</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
